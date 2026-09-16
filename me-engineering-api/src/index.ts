/**
 * ME Colombo Engineering (Ceyvista Engineering) Cloudflare Worker API
 * Backed by Cloudflare D1 (Database) & Cloudflare R2 (Object Storage)
 */

export interface Env {
	PHOTOS_BUCKET: R2Bucket;
	DB: D1Database;
}

const CORS_HEADERS: Record<string, string> = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Range',
	'Access-Control-Max-Age': '86400',
};

function json(data: any, status = 200, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...CORS_HEADERS,
			...headers,
		},
	});
}

function errorJson(message: string, status = 400, details?: any): Response {
	return json({ error: message, details }, status);
}

function handleCors(): Response {
	return new Response(null, {
		status: 204,
		headers: CORS_HEADERS,
	});
}

function generateUUID(): string {
	return crypto.randomUUID();
}

function nowISO(): string {
	return new Date().toISOString();
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return handleCors();
		}

		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		try {
			// -----------------------------------------------------------------------
			// 1. Health & Status
			// -----------------------------------------------------------------------
			if (path === '/' || path === '/health' || path === '/api/health') {
				let d1Status = 'unknown';
				let r2Status = 'unknown';
				let stats = null;

				try {
					const countRes = await env.DB.prepare('SELECT COUNT(*) AS total FROM work_orders').first<{ total: number }>();
					d1Status = 'connected';
					stats = { work_orders_count: countRes?.total ?? 0 };
				} catch (e: any) {
					d1Status = `error: ${e.message}`;
				}

				try {
					const listRes = await env.PHOTOS_BUCKET.list({ limit: 5 });
					r2Status = 'connected';
					stats = { ...stats, sample_photos_count: listRes.objects.length };
				} catch (e: any) {
					r2Status = `error: ${e.message}`;
				}

				return json({
					status: 'ok',
					service: 'ME Colombo Engineering API',
					version: '1.0.0',
					database: d1Status,
					storage: r2Status,
					stats,
					timestamp: nowISO(),
				});
			}

			// -----------------------------------------------------------------------
			// 2. Photo Serving: GET /api/photos/:filename or /photos/:filename
			// -----------------------------------------------------------------------
			const photoMatch = path.match(/^\/(?:api\/)?photos\/(.+)$/);
			if (photoMatch && method === 'GET') {
				const filename = decodeURIComponent(photoMatch[1]);
				const object = await env.PHOTOS_BUCKET.get(filename);

				if (!object) {
					return errorJson(`Photo '${filename}' not found`, 404);
				}

				let contentType = object.httpMetadata?.contentType;
				if (!contentType) {
					if (filename.endsWith('.png')) contentType = 'image/png';
					else if (filename.endsWith('.webp')) contentType = 'image/webp';
					else if (filename.endsWith('.gif')) contentType = 'image/gif';
					else if (filename.endsWith('.svg')) contentType = 'image/svg+xml';
					else contentType = 'image/jpeg';
				}

				const headers = new Headers();
				headers.set('Content-Type', contentType);
				headers.set('Cache-Control', 'public, max-age=31536000, immutable');
				if (object.httpEtag) headers.set('ETag', object.httpEtag);
				headers.set('Content-Length', object.size.toString());
				for (const [k, v] of Object.entries(CORS_HEADERS)) {
					headers.set(k, v);
				}

				return new Response(object.body, { headers });
			}

			// -----------------------------------------------------------------------
			// 3. Photo Upload: POST /api/upload
			// -----------------------------------------------------------------------
			if ((path === '/api/upload' || path === '/upload') && method === 'POST') {
				const contentTypeHeader = request.headers.get('content-type') || '';
				let filename = '';
				let buffer: ArrayBuffer;
				let fileType = 'image/jpeg';

				if (contentTypeHeader.includes('application/json')) {
					const body = await request.json<any>();
					const imageStr = body.image || body.base64 || body.data;
					if (!imageStr) {
						return errorJson('Missing image data (image / base64) in JSON payload', 400);
					}

					let base64Data = imageStr;
					if (imageStr.includes(',')) {
						const parts = imageStr.split(',');
						const meta = parts[0];
						base64Data = parts[1];
						const mimeMatch = meta.match(/data:([^;]+);/);
						if (mimeMatch) fileType = mimeMatch[1];
					}

					const binaryStr = atob(base64Data);
					const len = binaryStr.length;
					const bytes = new Uint8Array(len);
					for (let i = 0; i < len; i++) {
						bytes[i] = binaryStr.charCodeAt(i);
					}
					buffer = bytes.buffer;

					const ext = fileType.split('/')[1] || 'jpg';
					filename = body.filename || `photo_${Date.now()}_${generateUUID().slice(0, 8)}.${ext}`;
				} else if (contentTypeHeader.includes('multipart/form-data')) {
					const formData = await request.formData();
					const file = formData.get('file') || formData.get('photo') || formData.get('image');
					if (!file || !(file instanceof File)) {
						return errorJson('Missing file in form-data field "file" or "photo"', 400);
					}
					buffer = await file.arrayBuffer();
					fileType = file.type || 'image/jpeg';
					const ext = file.name.split('.').pop() || 'jpg';
					filename = `photo_${Date.now()}_${generateUUID().slice(0, 8)}.${ext}`;
				} else {
					// Raw binary body
					buffer = await request.arrayBuffer();
					fileType = contentTypeHeader || 'image/jpeg';
					const ext = fileType.includes('png') ? 'png' : fileType.includes('webp') ? 'webp' : 'jpg';
					filename = `photo_${Date.now()}_${generateUUID().slice(0, 8)}.${ext}`;
				}

				await env.PHOTOS_BUCKET.put(filename, buffer, {
					httpMetadata: {
						contentType: fileType,
					},
				});

				const photoPath = `/api/photos/${filename}`;
				const fullUrl = `${url.origin}${photoPath}`;

				return json({
					success: true,
					filename,
					url: photoPath,
					fullUrl,
					size: buffer.byteLength,
					contentType: fileType,
				}, 201);
			}

			// -----------------------------------------------------------------------
			// 4. Work Orders API: /api/work-orders
			// -----------------------------------------------------------------------

			// GET /api/work-orders
			if (path === '/api/work-orders' && method === 'GET') {
				const status = url.searchParams.get('status');
				const priority = url.searchParams.get('priority');
				const hotel = url.searchParams.get('hotel_name');
				const dept = url.searchParams.get('department_id') || url.searchParams.get('department_name');
				const search = url.searchParams.get('search');
				const limit = parseInt(url.searchParams.get('limit') || '500', 10);
				const offset = parseInt(url.searchParams.get('offset') || '0', 10);

				let query = 'SELECT * FROM work_orders WHERE 1=1';
				const params: any[] = [];

				if (status) {
					query += ' AND status = ?';
					params.push(status);
				}
				if (priority) {
					query += ' AND priority = ?';
					params.push(priority);
				}
				if (hotel) {
					query += ' AND hotel_name = ?';
					params.push(hotel);
				}
				if (dept) {
					query += ' AND (department_id = ? OR department_name = ?)';
					params.push(dept, dept);
				}
				if (search) {
					query += ' AND (title LIKE ? OR description LIKE ? OR work_order_number LIKE ? OR location LIKE ? OR room_number LIKE ?)';
					const searchParam = `%${search}%`;
					params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
				}

				query += ' ORDER BY reported_at DESC LIMIT ? OFFSET ?';
				params.push(limit, offset);

				const stmt = env.DB.prepare(query);
				const { results } = await stmt.bind(...params).all();

				return json(results);
			}

			// GET /api/work-orders/:id
			const woIdMatch = path.match(/^\/api\/work-orders\/([^\/]+)$/);
			if (woIdMatch && method === 'GET') {
				const idOrNum = decodeURIComponent(woIdMatch[1]);
				const wo = await env.DB.prepare(
					'SELECT * FROM work_orders WHERE id = ? OR work_order_number = ?'
				).bind(idOrNum, idOrNum).first();

				if (!wo) {
					return errorJson(`Work order '${idOrNum}' not found`, 404);
				}

				const targetId = (wo as any).id;
				const [historyRes, photosRes, commentsRes] = await Promise.all([
					env.DB.prepare('SELECT * FROM work_order_status_history WHERE work_order_id = ? ORDER BY timestamp ASC').bind(targetId).all(),
					env.DB.prepare('SELECT * FROM work_order_photos WHERE work_order_id = ? ORDER BY created_at ASC').bind(targetId).all(),
					env.DB.prepare('SELECT * FROM work_order_comments WHERE work_order_id = ? ORDER BY created_at ASC').bind(targetId).all(),
				]);

				return json({
					...wo,
					status_history: historyRes.results || [],
					photos: photosRes.results || [],
					comments: commentsRes.results || [],
				});
			}

			// POST /api/work-orders (Create Work Order)
			if (path === '/api/work-orders' && method === 'POST') {
				const body = await request.json<any>();
				const id = body.id || generateUUID();
				const now = nowISO();

				let workOrderNumber = body.work_order_number;
				if (!workOrderNumber) {
					const year = new Date().getFullYear();
					const latest = await env.DB.prepare(
						"SELECT work_order_number FROM work_orders WHERE work_order_number LIKE ? ORDER BY work_order_number DESC LIMIT 1"
					).bind(`WO-${year}-%`).first<{ work_order_number: string }>();

					let nextSeq = 1;
					if (latest && latest.work_order_number) {
						const parts = latest.work_order_number.split('-');
						const num = parseInt(parts[2], 10);
						if (!isNaN(num)) nextSeq = num + 1;
					}
					workOrderNumber = `WO-${year}-${String(nextSeq).padStart(4, '0')}`;
				}

				const reportedBy = body.reported_by || 'Anonymous';
				const reportedById = body.reported_by_id || null;
				const deptId = body.department_id || null;
				const deptName = body.department_name || 'General';
				const location = body.location || '';
				const roomNumber = body.room_number || null;
				const category = body.category || 'General';
				const title = body.title || 'Untitled Work Order';
				const description = body.description || '';
				const photoUrl = body.photo_url || null;
				const afterPhotoUrl = body.after_photo_url || null;
				const guestAffected = body.guest_affected ? 1 : 0;
				const priority = body.priority || 'P3';
				const suggestedPriority = body.suggested_priority || null;
				const status = body.status || 'NEW';
				const assignedTechId = body.assigned_technician_id || null;
				const assignedTechName = body.assigned_technician_name || null;
				const hotelName = body.hotel_name || 'ME Colombo';
				const reportedAt = body.reported_at || now;

				await env.DB.prepare(`
					INSERT INTO work_orders (
						id, work_order_number, reported_by, reported_by_id, department_id, department_name,
						location, room_number, category, title, description, photo_url, after_photo_url,
						guest_affected, priority, suggested_priority, status, assigned_technician_id,
						assigned_technician_name, reported_at, created_at, updated_at, hotel_name
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`).bind(
					id, workOrderNumber, reportedBy, reportedById, deptId, deptName,
					location, roomNumber, category, title, description, photoUrl, afterPhotoUrl,
					guestAffected, priority, suggestedPriority, status, assignedTechId,
					assignedTechName, reportedAt, now, now, hotelName
				).run();

				// Automatically log initial status in status history
				const historyId = generateUUID();
				await env.DB.prepare(`
					INSERT INTO work_order_status_history (id, work_order_id, status, timestamp, actor_name, note)
					VALUES (?, ?, ?, ?, ?, ?)
				`).bind(historyId, id, status, now, reportedBy, 'Work order created').run();

				const created = await env.DB.prepare('SELECT * FROM work_orders WHERE id = ?').bind(id).first();
				return json(created, 201);
			}

			// PUT or PATCH /api/work-orders/:id
			if (woIdMatch && (method === 'PUT' || method === 'PATCH')) {
				const idOrNum = decodeURIComponent(woIdMatch[1]);
				const current = await env.DB.prepare(
					'SELECT * FROM work_orders WHERE id = ? OR work_order_number = ?'
				).bind(idOrNum, idOrNum).first<any>();

				if (!current) {
					return errorJson(`Work order '${idOrNum}' not found`, 404);
				}

				const body = await request.json<any>();
				const targetId = current.id;
				const now = nowISO();

				const fields: string[] = [];
				const values: any[] = [];

				const allowedUpdates = [
					'reported_by', 'department_id', 'department_name', 'location', 'room_number',
					'category', 'title', 'description', 'photo_url', 'after_photo_url',
					'guest_affected', 'priority', 'suggested_priority', 'status',
					'assigned_technician_id', 'assigned_technician_name', 'accepted_at',
					'started_at', 'waiting_at', 'completed_at', 'closed_at', 'accepted_by',
					'closed_by', 'waiting_reason', 'work_done', 'completion_note', 'hotel_name'
				];

				for (const field of allowedUpdates) {
					if (body[field] !== undefined) {
						fields.push(`${field} = ?`);
						let val = body[field];
						if (field === 'guest_affected') {
							val = val ? 1 : 0;
						}
						values.push(val);
					}
				}

				fields.push('updated_at = ?');
				values.push(now);

				values.push(targetId);

				const updateSql = `UPDATE work_orders SET ${fields.join(', ')} WHERE id = ?`;
				await env.DB.prepare(updateSql).bind(...values).run();

				// If status changed or history requested, log it
				if (body.status && body.status !== current.status) {
					const historyId = generateUUID();
					const actor = body.actor_name || body.accepted_by || body.closed_by || body.updated_by || 'System';
					const note = body.status_note || body.note || body.completion_note || body.waiting_reason || `Status updated to ${body.status}`;

					await env.DB.prepare(`
						INSERT INTO work_order_status_history (id, work_order_id, status, timestamp, actor_name, note)
						VALUES (?, ?, ?, ?, ?, ?)
					`).bind(historyId, targetId, body.status, now, actor, note).run();
				}

				const updated = await env.DB.prepare('SELECT * FROM work_orders WHERE id = ?').bind(targetId).first();
				return json(updated);
			}

			// DELETE /api/work-orders/:id
			if (woIdMatch && method === 'DELETE') {
				const idOrNum = decodeURIComponent(woIdMatch[1]);
				const target = await env.DB.prepare(
					'SELECT id FROM work_orders WHERE id = ? OR work_order_number = ?'
				).bind(idOrNum, idOrNum).first<{ id: string }>();

				if (!target) {
					return errorJson(`Work order '${idOrNum}' not found`, 404);
				}

				await env.DB.prepare('DELETE FROM work_orders WHERE id = ?').bind(target.id).run();
				return json({ success: true, deleted_id: target.id });
			}

			// -----------------------------------------------------------------------
			// 5. Work Order Sub-Resources (History, Comments, Photos)
			// -----------------------------------------------------------------------
			const subResourceMatch = path.match(/^\/api\/work-orders\/([^\/]+)\/(history|comments|photos)$/);
			if (subResourceMatch) {
				const idOrNum = decodeURIComponent(subResourceMatch[1]);
				const resource = subResourceMatch[2];

				const wo = await env.DB.prepare(
					'SELECT id FROM work_orders WHERE id = ? OR work_order_number = ?'
				).bind(idOrNum, idOrNum).first<{ id: string }>();

				if (!wo) {
					return errorJson(`Work order '${idOrNum}' not found`, 404);
				}

				const workOrderId = wo.id;

				if (resource === 'history') {
					if (method === 'GET') {
						const { results } = await env.DB.prepare(
							'SELECT * FROM work_order_status_history WHERE work_order_id = ? ORDER BY timestamp ASC'
						).bind(workOrderId).all();
						return json(results);
					}
					if (method === 'POST') {
						const body = await request.json<any>();
						const id = body.id || generateUUID();
						const status = body.status || 'UPDATE';
						const timestamp = body.timestamp || nowISO();
						const actor = body.actor_name || 'System';
						const note = body.note || '';

						await env.DB.prepare(`
							INSERT INTO work_order_status_history (id, work_order_id, status, timestamp, actor_name, note)
							VALUES (?, ?, ?, ?, ?, ?)
						`).bind(id, workOrderId, status, timestamp, actor, note).run();

						return json({ id, work_order_id: workOrderId, status, timestamp, actor_name: actor, note }, 201);
					}
				}

				if (resource === 'comments') {
					if (method === 'GET') {
						const { results } = await env.DB.prepare(
							'SELECT * FROM work_order_comments WHERE work_order_id = ? ORDER BY created_at ASC'
						).bind(workOrderId).all();
						return json(results);
					}
					if (method === 'POST') {
						const body = await request.json<any>();
						const id = body.id || generateUUID();
						const userName = body.user_name || 'Anonymous';
						const userRole = body.user_role || 'STAFF';
						const message = body.message || '';
						const createdAt = body.created_at || nowISO();

						await env.DB.prepare(`
							INSERT INTO work_order_comments (id, work_order_id, user_name, user_role, message, created_at)
							VALUES (?, ?, ?, ?, ?, ?)
						`).bind(id, workOrderId, userName, userRole, message, createdAt).run();

						return json({ id, work_order_id: workOrderId, user_name: userName, user_role: userRole, message, created_at: createdAt }, 201);
					}
				}

				if (resource === 'photos') {
					if (method === 'GET') {
						const { results } = await env.DB.prepare(
							'SELECT * FROM work_order_photos WHERE work_order_id = ? ORDER BY created_at ASC'
						).bind(workOrderId).all();
						return json(results);
					}
					if (method === 'POST') {
						const body = await request.json<any>();
						const id = body.id || generateUUID();
						const photoUrl = body.photo_url;
						if (!photoUrl) return errorJson('photo_url is required', 400);
						const photoType = body.photo_type || 'before';
						const caption = body.caption || null;
						const uploadedBy = body.uploaded_by || null;
						const createdAt = body.created_at || nowISO();

						await env.DB.prepare(`
							INSERT INTO work_order_photos (id, work_order_id, photo_url, photo_type, caption, uploaded_by, created_at)
							VALUES (?, ?, ?, ?, ?, ?, ?)
						`).bind(id, workOrderId, photoUrl, photoType, caption, uploadedBy, createdAt).run();

						return json({ id, work_order_id: workOrderId, photo_url: photoUrl, photo_type: photoType, caption, uploaded_by: uploadedBy, created_at: createdAt }, 201);
					}
				}
			}

			// -----------------------------------------------------------------------
			// 6. Profiles & Authentication API: /api/profiles
			// -----------------------------------------------------------------------
			if (path === '/api/profiles' && method === 'GET') {
				const { results } = await env.DB.prepare('SELECT * FROM profiles ORDER BY name ASC').all();
				return json(results);
			}

			const profileIdMatch = path.match(/^\/api\/profiles\/([^\/]+)$/);
			if (profileIdMatch && method === 'GET') {
				const idOrEmail = decodeURIComponent(profileIdMatch[1]);
				const profile = await env.DB.prepare(
					'SELECT * FROM profiles WHERE id = ? OR email = ?'
				).bind(idOrEmail, idOrEmail).first();

				if (!profile) return errorJson(`Profile '${idOrEmail}' not found`, 404);
				return json(profile);
			}

			if (path === '/api/profiles/login' && method === 'POST') {
				const body = await request.json<any>();
				const email = (body.email || '').trim().toLowerCase();
				const name = (body.name || '').trim();

				let profile = null;
				if (email) {
					profile = await env.DB.prepare('SELECT * FROM profiles WHERE LOWER(email) = ?').bind(email).first();
				} else if (name) {
					profile = await env.DB.prepare('SELECT * FROM profiles WHERE LOWER(name) = ?').bind(name.toLowerCase()).first();
				}

				if (!profile) {
					return errorJson('Invalid login credentials or user profile not found', 401);
				}

				return json({ success: true, profile });
			}

			if (path === '/api/profiles' && method === 'POST') {
				const body = await request.json<any>();
				const id = body.id || generateUUID();
				const name = body.name;
				const email = body.email;
				const role = body.role || 'TECHNICIAN';
				const department = body.department || 'Engineering';
				const phone = body.phone || null;
				const active = body.active !== undefined ? (body.active ? 1 : 0) : 1;
				const now = nowISO();

				if (!name || !email) return errorJson('Name and email are required', 400);

				await env.DB.prepare(`
					INSERT INTO profiles (id, name, email, role, department, phone, active, created_at, updated_at)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(email) DO UPDATE SET
						name = excluded.name,
						role = excluded.role,
						department = excluded.department,
						phone = excluded.phone,
						active = excluded.active,
						updated_at = excluded.updated_at
				`).bind(id, name, email, role, department, phone, active, now, now).run();

				const saved = await env.DB.prepare('SELECT * FROM profiles WHERE email = ?').bind(email).first();
				return json(saved, 201);
			}

			if (profileIdMatch && (method === 'PUT' || method === 'PATCH')) {
				const id = decodeURIComponent(profileIdMatch[1]);
				const body = await request.json<any>();
				const now = nowISO();

				const fields: string[] = [];
				const values: any[] = [];

				for (const field of ['name', 'email', 'role', 'department', 'phone', 'active']) {
					if (body[field] !== undefined) {
						fields.push(`${field} = ?`);
						values.push(field === 'active' ? (body[field] ? 1 : 0) : body[field]);
					}
				}

				fields.push('updated_at = ?');
				values.push(now);
				values.push(id);

				await env.DB.prepare(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
				const updated = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first();
				return json(updated);
			}

			// -----------------------------------------------------------------------
			// 7. Technicians API: /api/technicians
			// -----------------------------------------------------------------------
			if (path === '/api/technicians' && method === 'GET') {
				const { results } = await env.DB.prepare('SELECT * FROM technicians ORDER BY name ASC').all();
				return json(results);
			}

			if (path === '/api/technicians' && method === 'POST') {
				const body = await request.json<any>();
				const id = body.id || generateUUID();
				const name = body.name;
				const department = body.department || 'Engineering';
				const specialization = body.specialization || 'General Maintenance';
				const phone = body.phone || null;
				const active = body.active !== undefined ? (body.active ? 1 : 0) : 1;
				const now = nowISO();

				if (!name) return errorJson('Technician name is required', 400);

				await env.DB.prepare(`
					INSERT INTO technicians (id, name, department, specialization, phone, active, created_at)
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`).bind(id, name, department, specialization, phone, active, now).run();

				const created = await env.DB.prepare('SELECT * FROM technicians WHERE id = ?').bind(id).first();
				return json(created, 201);
			}

			// -----------------------------------------------------------------------
			// 8. Departments API: /api/departments
			// -----------------------------------------------------------------------
			if (path === '/api/departments' && method === 'GET') {
				const { results } = await env.DB.prepare('SELECT * FROM departments ORDER BY name ASC').all();
				return json(results);
			}

			if (path === '/api/departments' && method === 'POST') {
				const body = await request.json<any>();
				const id = body.id || generateUUID();
				const name = body.name;
				const code = body.code || name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
				const icon = body.icon || null;
				const active = body.active !== undefined ? (body.active ? 1 : 0) : 1;
				const now = nowISO();

				await env.DB.prepare(`
					INSERT INTO departments (id, name, code, icon, active, created_at)
					VALUES (?, ?, ?, ?, ?, ?)
					ON CONFLICT(code) DO UPDATE SET
						name = excluded.name,
						icon = excluded.icon,
						active = excluded.active
				`).bind(id, name, code, icon, active, now).run();

				const saved = await env.DB.prepare('SELECT * FROM departments WHERE code = ?').bind(code).first();
				return json(saved, 201);
			}

			// -----------------------------------------------------------------------
			// 9. System Settings API: /api/system-settings
			// -----------------------------------------------------------------------
			if (path === '/api/system-settings' && method === 'GET') {
				let settings = await env.DB.prepare('SELECT * FROM system_settings LIMIT 1').first();
				if (!settings) {
					settings = {
						id: generateUUID(),
						hotel_name: 'ME Colombo Hotel',
						hotel_logo: null,
						hotel_address: 'No. 16, Park Road, Havelock Town, Colombo 05, Sri Lanka',
						hotel_contact_email: 'engineering@mecolombo.com',
						hotel_contact_phone: '+94 11 765 4321',
						p1_label: 'P1 – EMERGENCY 🔴',
						p2_label: 'P2 – HIGH 🟠',
						p3_label: 'P3 – NORMAL 🟡',
						p4_label: 'P4 – PLANNED 🟢',
						sound_alert_enabled: 1,
					};
				}
				return json(settings);
			}

			if ((path === '/api/system-settings' || path === '/api/settings') && (method === 'POST' || method === 'PUT')) {
				const body = await request.json<any>();
				const existing = await env.DB.prepare('SELECT id FROM system_settings LIMIT 1').first<{ id: string }>();
				const id = existing?.id || body.id || generateUUID();
				const now = nowISO();

				await env.DB.prepare(`
					INSERT INTO system_settings (
						id, hotel_name, hotel_logo, hotel_address, hotel_contact_email,
						hotel_contact_phone, p1_label, p2_label, p3_label, p4_label,
						sound_alert_enabled, created_at, updated_at
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(id) DO UPDATE SET
						hotel_name = excluded.hotel_name,
						hotel_logo = excluded.hotel_logo,
						hotel_address = excluded.hotel_address,
						hotel_contact_email = excluded.hotel_contact_email,
						hotel_contact_phone = excluded.hotel_contact_phone,
						p1_label = excluded.p1_label,
						p2_label = excluded.p2_label,
						p3_label = excluded.p3_label,
						p4_label = excluded.p4_label,
						sound_alert_enabled = excluded.sound_alert_enabled,
						updated_at = excluded.updated_at
				`).bind(
					id,
					body.hotel_name || 'ME Colombo Hotel',
					body.hotel_logo || null,
					body.hotel_address || 'No. 16, Park Road, Havelock Town, Colombo 05, Sri Lanka',
					body.hotel_contact_email || 'engineering@mecolombo.com',
					body.hotel_contact_phone || '+94 11 765 4321',
					body.p1_label || 'P1 – EMERGENCY 🔴',
					body.p2_label || 'P2 – HIGH 🟠',
					body.p3_label || 'P3 – NORMAL 🟡',
					body.p4_label || 'P4 – PLANNED 🟢',
					body.sound_alert_enabled !== undefined ? (body.sound_alert_enabled ? 1 : 0) : 1,
					now,
					now
				).run();

				const saved = await env.DB.prepare('SELECT * FROM system_settings WHERE id = ?').bind(id).first();
				return json(saved);
			}

			// -----------------------------------------------------------------------
			// 10. Notifications API: /api/notifications
			// -----------------------------------------------------------------------
			if (path === '/api/notifications' && method === 'GET') {
				const { results } = await env.DB.prepare(
					'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100'
				).all();
				return json(results);
			}

			if (path === '/api/notifications' && method === 'POST') {
				const body = await request.json<any>();
				const id = body.id || generateUUID();
				const workOrderId = body.work_order_id || null;
				const title = body.title || 'New Notification';
				const message = body.message || '';
				const type = body.type || 'INFO';
				const isRead = body.is_read ? 1 : 0;
				const now = nowISO();

				await env.DB.prepare(`
					INSERT INTO notifications (id, work_order_id, title, message, type, is_read, created_at)
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`).bind(id, workOrderId, title, message, type, isRead, now).run();

				return json({ id, work_order_id: workOrderId, title, message, type, is_read: isRead, created_at: now }, 201);
			}

			if (path === '/api/notifications/read-all' && (method === 'PUT' || method === 'POST')) {
				await env.DB.prepare('UPDATE notifications SET is_read = 1').run();
				return json({ success: true, message: 'All notifications marked as read' });
			}

			const notifReadMatch = path.match(/^\/api\/notifications\/([^\/]+)\/read$/);
			if (notifReadMatch && (method === 'PUT' || method === 'POST')) {
				const id = decodeURIComponent(notifReadMatch[1]);
				await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').bind(id).run();
				return json({ success: true, id });
			}

			// -----------------------------------------------------------------------
			// 11. Stats / Dashboard Aggregation: /api/stats
			// -----------------------------------------------------------------------
			if (path === '/api/stats' && method === 'GET') {
				const [totalRes, statusRes, priorityRes, hotelRes] = await Promise.all([
					env.DB.prepare('SELECT COUNT(*) AS total FROM work_orders').first<{ total: number }>(),
					env.DB.prepare('SELECT status, COUNT(*) AS count FROM work_orders GROUP BY status').all(),
					env.DB.prepare('SELECT priority, COUNT(*) AS count FROM work_orders GROUP BY priority').all(),
					env.DB.prepare('SELECT hotel_name, COUNT(*) AS count FROM work_orders GROUP BY hotel_name').all(),
				]);

				const statusCounts: Record<string, number> = {
					NEW: 0,
					ACCEPTED: 0,
					IN_PROGRESS: 0,
					WAITING: 0,
					COMPLETED: 0,
					CLOSED: 0,
				};
				for (const row of (statusRes.results as any[])) {
					if (row.status) statusCounts[row.status] = row.count;
				}

				const priorityCounts: Record<string, number> = {
					P1: 0,
					P2: 0,
					P3: 0,
					P4: 0,
				};
				for (const row of (priorityRes.results as any[])) {
					if (row.priority) priorityCounts[row.priority] = row.count;
				}

				return json({
					total: totalRes?.total ?? 0,
					by_status: statusCounts,
					by_priority: priorityCounts,
					by_hotel: hotelRes.results || [],
					timestamp: nowISO(),
				});
			}

			return errorJson(`Endpoint '${method} ${path}' not found`, 404);
		} catch (err: any) {
			console.error('Worker API Error:', err);
			return errorJson(err.message || 'Internal Server Error', 500, {
				stack: err.stack,
			});
		}
	},
} satisfies ExportedHandler<Env>;
