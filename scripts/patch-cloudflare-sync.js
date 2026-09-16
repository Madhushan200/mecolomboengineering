const fs = require('fs');
const path = require('path');

const chunkFile = path.join(__dirname, '..', 'out', '_next', 'static', 'chunks', '209-c9668f906c15f1d9.js');
const publicChunkFile = path.join(__dirname, '..', 'public', '_next', 'static', 'chunks', '209-c9668f906c15f1d9.js');
const androidChunkFile = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public', '_next', 'static', 'chunks', '209-c9668f906c15f1d9.js');

// Create the updated 209 chunk with Cloudflare Worker API integration & Bulletproof Error Guards
const newChunkCode = `"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[209],{
20195:(e,t,r)=>{
  r.d(t,{RR:()=>l,Y4:()=>i,gm:()=>a,jM:()=>o,rp:()=>n});
  let o={hotelName:"Ceyvista Engineering",hotelLogo:"/logo.png",hotelAddress:"Colombo, Sri Lanka",hotelContactEmail:"engineering@ceyvista.com",hotelContactPhone:"+94 11 765 4321",p1Label:"P1 – EMERGENCY 🔴",p2Label:"P2 – HIGH 🟠",p3Label:"P3 – NORMAL 🟡",p4Label:"P4 – PLANNED 🟢",soundAlertEnabled:!0},
  a=[{id:"dept-fo",name:"Front Office",code:"FO",active:!0},{id:"dept-hk",name:"Housekeeping",code:"HK",active:!0},{id:"dept-fb",name:"F&B Service",code:"FB",active:!0},{id:"dept-kit",name:"Kitchen & Culinary",code:"KIT",active:!0},{id:"dept-sec",name:"Security & Safety",code:"SEC",active:!0},{id:"dept-mgmt",name:"General Management",code:"MGMT",active:!0},{id:"dept-admin",name:"Administration & HR",code:"ADMIN",active:!0},{id:"dept-spa",name:"Spa & Wellness",code:"SPA",active:!0}],
  i=[{id:"tech-kasun",name:"Kasun Perera",department:"Engineering",specialization:"Electrical & Automation",active:!0,phone:"+94 77 123 4567"},{id:"tech-nimal",name:"Nimal Silva",department:"Engineering",specialization:"Plumbing & Water Systems",active:!0,phone:"+94 77 234 5678"},{id:"tech-pradeep",name:"Pradeep Fernando",department:"Engineering",specialization:"Air Conditioning / HVAC",active:!0,phone:"+94 77 345 6789"},{id:"tech-suresh",name:"Suresh Bandara",department:"Engineering",specialization:"Carpentry & General Civil",active:!0,phone:"+94 77 456 7890"}],
  n=[{id:"user-admin",name:"ME Colombo Administrator",username:"mecolomboadmin",email:"mecolomboadmin@mecolombo.com",password:"adminme1234",role:"ADMIN",department:"Administration",active:!0}],
  l=[];
},
52002:(e,t,r)=>{
  r.d(t,{J6:()=>d,M1:()=>m,_f:()=>i,mY:()=>u,n5:()=>l,oG:()=>n,pk:()=>c,xN:()=>s});
  var a=r(66779);
  const API_BASE = "https://me-engineering-api.madhushan875.workers.dev";

  function i(e, t = []){
    if (!e || typeof e !== "object") return null;
    let r = e.hotel_name || e.hotelName || "ME Colombo",
        o = e.description || "",
        match = typeof o === "string" ? o.match(/^\\[Property:\\s*([^\\]]+)\\]\\s*\\n?/i) : null;
    if (match) {
      r = match[1].trim();
      o = o.replace(/^\\[Property:\\s*([^\\]]+)\\]\\s*\\n?/i, "").trim();
    }
    if (typeof r === "string" && r.toLowerCase() === "neva") r = "NEVA";

    // Safely parse status history
    let rawHist = Array.isArray(t) && t.length > 0 ? t : (Array.isArray(e.status_history) ? e.status_history : (Array.isArray(e.history) ? e.history : []));
    let safeHist = [];
    if (typeof rawHist === "string") {
      try { safeHist = JSON.parse(rawHist); } catch(err) { safeHist = []; }
    } else if (Array.isArray(rawHist)) {
      safeHist = rawHist;
    }

    let historyList = (safeHist || []).filter(Boolean).map(h => ({
      id: h.id || (0, a.l)(),
      workOrderId: h.work_order_id || h.workOrderId || e.id,
      status: h.status || "NEW",
      timestamp: h.timestamp || h.created_at || e.created_at || new Date().toISOString(),
      actorName: h.actor_name || h.actorName || e.reported_by || e.reportedBy || "Staff",
      note: h.note || ""
    }));

    if (historyList.length === 0) {
      historyList = [{
        id: (0, a.l)(),
        workOrderId: e.id || (0, a.l)(),
        status: e.status || "NEW",
        timestamp: e.created_at || e.reported_at || new Date().toISOString(),
        actorName: e.reported_by || e.reportedBy || "Staff",
        note: "Request recorded in system"
      }];
    }

    let woNum = e.work_order_number || e.workOrderNumber || ("WO-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random()*9000)+1000));

    return {
      id: e.id || (0, a.l)(),
      workOrderNumber: woNum,
      hotelName: r,
      reportedBy: e.reported_by || e.reportedBy || "Staff",
      reportedById: e.reported_by_id || e.reportedById || null,
      departmentId: e.department_id || e.departmentId || null,
      departmentName: e.department_name || e.departmentName || "Engineering",
      location: e.location || "",
      roomNumber: e.room_number || e.roomNumber || null,
      category: e.category || "General",
      title: e.title || "Maintenance Request",
      description: o,
      photoUrl: e.photo_url || e.photoUrl || null,
      afterPhotoUrl: e.after_photo_url || e.afterPhotoUrl || null,
      guestAffected: !!(e.guest_affected || e.guestAffected),
      priority: e.priority || "P3",
      suggestedPriority: e.suggested_priority || e.suggestedPriority || null,
      status: e.status || "NEW",
      assignedTechnicianId: e.assigned_technician_id || e.assignedTechnicianId || null,
      assignedTechnicianName: e.assigned_technician_name || e.assignedTechnicianName || null,
      reportedAt: e.reported_at || e.reportedAt || e.created_at || new Date().toISOString(),
      acceptedAt: e.accepted_at || e.acceptedAt || null,
      startedAt: e.started_at || e.startedAt || null,
      waitingAt: e.waiting_at || e.waitingAt || null,
      completedAt: e.completed_at || e.completedAt || null,
      closedAt: e.closed_at || e.closedAt || null,
      acceptedBy: e.accepted_by || e.acceptedBy || null,
      closedBy: e.closed_by || e.closedBy || null,
      waitingReason: e.waiting_reason || e.waitingReason || null,
      workDone: e.work_done || e.workDone || null,
      completionNote: e.completion_note || e.completionNote || null,
      createdAt: e.created_at || e.createdAt || e.reported_at || new Date().toISOString(),
      updatedAt: e.updated_at || e.updatedAt || e.reported_at || new Date().toISOString(),
      history: historyList
    };
  }

  async function n(e) {
    try {
      if (!e) return;
      let desc = e.description || "",
          hotel = e.hotelName || "ME Colombo";
      if (typeof desc === "string" && !desc.startsWith("[Property:")) {
        desc = "[Property: " + hotel + "]\\n" + desc;
      }
      let payload = {
        id: (0, a.a)(e.id) ? e.id : (0, a.l)(),
        work_order_number: e.workOrderNumber,
        hotel_name: hotel,
        reported_by: e.reportedBy,
        reported_by_id: (0, a.a)(e.reportedById) ? e.reportedById : null,
        department_id: (0, a.a)(e.departmentId) ? e.departmentId : null,
        department_name: e.departmentName,
        location: e.location,
        room_number: e.roomNumber || null,
        category: e.category,
        title: e.title,
        description: typeof desc === "string" ? desc.trim() || null : null,
        photo_url: e.photoUrl || null,
        after_photo_url: e.afterPhotoUrl || null,
        guest_affected: e.guestAffected ? 1 : 0,
        priority: e.priority,
        suggested_priority: e.suggestedPriority || null,
        status: e.status,
        assigned_technician_id: (0, a.a)(e.assignedTechnicianId) ? e.assignedTechnicianId : null,
        assigned_technician_name: e.assignedTechnicianName || null,
        reported_at: e.reportedAt,
        accepted_at: e.acceptedAt || null,
        started_at: e.startedAt || null,
        waiting_at: e.waitingAt || null,
        completed_at: e.completedAt || null,
        closed_at: e.closedAt || null,
        accepted_by: e.acceptedBy || null,
        closed_by: e.closedBy || null,
        waiting_reason: e.waitingReason || null,
        work_done: e.workDone || null,
        completion_note: e.completionNote || null
      };

      let res = await fetch(API_BASE + "/api/work-orders/" + encodeURIComponent(payload.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok && res.status === 404) {
        await fetch(API_BASE + "/api/work-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      console.warn("Cloudflare Worker syncWorkOrder error:", err);
    }
  }

  async function l() {
    try {
      let res = await fetch(API_BASE + "/api/work-orders");
      if (!res.ok) return null;
      let data = await res.json();
      if (!data || !Array.isArray(data)) return [];
      return data.map(item => i(item, item.status_history || [])).filter(Boolean);
    } catch (err) {
      console.warn("Cloudflare Worker fetchWorkOrders error:", err);
      return null;
    }
  }

  async function s(id, num) {
    try {
      let target = id || num;
      if (!target) return false;
      let res = await fetch(API_BASE + "/api/work-orders/" + encodeURIComponent(target), {
        method: "DELETE"
      });
      return res.ok;
    } catch (err) {
      console.warn("Cloudflare Worker deleteWorkOrder error:", err);
      return false;
    }
  }

  function d(e) {
    if (!e) return null;
    let t = (e.email || "").split("@")[0].toLowerCase(),
        r = "",
        o = "";
    if (e.phone) {
      try {
        let a = JSON.parse(e.phone);
        if (a && a.username) t = a.username.toLowerCase();
        if (a && a.password) r = a.password;
        if (a && a.phone) o = a.phone;
      } catch (err) {
        o = e.phone;
      }
    }
    return {
      id: e.id,
      name: e.name || "User",
      username: t,
      email: e.email || "",
      password: r,
      role: e.role || "ENGINEERING",
      department: e.department || "Engineering",
      phone: o,
      active: e.active !== 0 && e.active !== false
    };
  }

  async function c(e) {
    try {
      if (!e) return false;
      let phoneData = JSON.stringify({
        username: ((e.username || (e.email ? e.email.split("@")[0] : "user"))).trim().toLowerCase(),
        password: e.password || "",
        phone: e.phone || ""
      });
      let payload = {
        id: (0, a.a)(e.id) ? e.id : (0, a.l)(),
        name: (e.name || "User").trim(),
        email: (e.email || "user@mecolombo.com").trim().toLowerCase(),
        role: e.role || "ENGINEERING",
        department: e.department || "Engineering",
        phone: phoneData,
        active: e.active ? 1 : 0
      };
      let res = await fetch(API_BASE + "/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (err) {
      console.warn("Cloudflare Worker syncProfile error:", err);
      return false;
    }
  }

  async function u(id) {
    try {
      if (!id) return false;
      let res = await fetch(API_BASE + "/api/profiles/" + encodeURIComponent(id), {
        method: "DELETE"
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  async function m() {
    try {
      let res = await fetch(API_BASE + "/api/profiles");
      if (!res.ok) return null;
      let data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map(d).filter(Boolean);
    } catch (err) {
      return null;
    }
  }
},
62209:(e,t,r)=>{
  r.d(t,{EngineeringProvider:()=>h,V:()=>f});
  var o=r(95155),a=r(12115),i=r(20195);
  class n{
    unlockAudio(){
      try{
        if(!this.audioCtx){
          let e=window.AudioContext||window.webkitAudioContext;
          this.audioCtx=new e;
        }
        if("suspended"===this.audioCtx.state) this.audioCtx.resume();
        this.isAudioUnlocked=!0;
        return !0;
      }catch(e){return false;}
    }
    isUnlocked(){return this.isAudioUnlocked&&null!==this.audioCtx&&"running"===this.audioCtx.state;}
    setMuted(e){this.isMuted=e;localStorage.setItem("hotel_eng_sound_muted",String(e));if(e)this.stopAlert();}
    getMuted(){return this.isMuted;}
    playChime(){
      if(!this.isMuted){
        this.unlockAudio();
        if(this.audioCtx){
          try{
            let e=this.audioCtx.currentTime,t=this.audioCtx.createOscillator(),r=this.audioCtx.createGain();
            t.type="sine";t.frequency.setValueAtTime(587.33,e);
            r.gain.setValueAtTime(.2,e);r.gain.exponentialRampToValueAtTime(.001,e+.6);
            t.connect(r);r.connect(this.audioCtx.destination);t.start(e);t.stop(e+.6);
            let o=this.audioCtx.createOscillator(),a=this.audioCtx.createGain();
            o.type="sine";o.frequency.setValueAtTime(880,e+.18);
            a.gain.setValueAtTime(.25,e+.18);a.gain.exponentialRampToValueAtTime(.001,e+.9);
            o.connect(a);a.connect(this.audioCtx.destination);o.start(e+.18);o.stop(e+.9);
          }catch(err){}
        }
      }
    }
    startLoopingAlert(){if(!this.intervalId){this.playChime();this.intervalId=setInterval(()=>{this.playChime();},3500);}}
    stopAlert(){if(this.intervalId){clearInterval(this.intervalId);this.intervalId=null;}}
    constructor(){
      this.audioCtx=null;this.intervalId=null;this.isMuted=!1;this.isAudioUnlocked=!1;
      let e=localStorage.getItem("hotel_eng_sound_muted");
      if(null!==e) this.isMuted="true"===e;
    }
  }
  let l=new n;
  var d=r(52002),c=r(66779),u=r(8703);
  let m="me_colombo_duty_alerts_v2";
  class p{
    async init(){
      if(!this.isInitialized){
        try{
          let e=await u.W.checkPermissions();
          if("granted"!==e.display) await u.W.requestPermissions();
          await u.W.createChannel({
            id:m,name:"ME Colombo Emergency Alerts",
            description:"Audible emergency alert when new engineering requests arrive",
            importance:5,visibility:1,sound:"default",vibration:!0,lights:!0,lightColor:"#EF4444"
          });
          this.isInitialized=!0;
        }catch(e){}
      }
    }
    async sendNewTicketAlert(e){
      try{
        if(!e) return;
        await this.init();
        let t=e.roomNumber?"Room "+e.roomNumber:(e.location || "Hotel Area"),r=Math.floor(Date.now()%1e5);
        await u.W.schedule({
          notifications:[{
            id:r,title:"🚨 ["+(e.priority || "P3")+"] NEW WORK ORDER: "+(e.workOrderNumber || ""),
            body:"📍 "+t+" • "+(e.title || "Request")+" ("+(e.departmentName || "General")+")",
            channelId:m,schedule:{at:new Date(Date.now()+150)},sound:"default",
            actionTypeId:"OPEN_TICKET",extra:{workOrderNumber:e.workOrderNumber}
          }]
        });
      }catch(e){}
    }
    constructor(){this.isInitialized=!1;}
  }
  let g=new p,_=(0,a.createContext)(void 0);

  function h(e){
    let{children:t}=e,
    [r,n]=(0,a.useState)(!1),
    [u,m]=(0,a.useState)(i.jM),
    [p,h]=(0,a.useState)(i.gm),
    [f,w]=(0,a.useState)(i.Y4),
    [y,N]=(0,a.useState)(i.rp),
    [S,v]=(0,a.useState)(null),
    [I,b]=(0,a.useState)([]),
    [A,k]=(0,a.useState)(!1),
    [E,C]=(0,a.useState)(!0),
    [O,x]=(0,a.useState)(null);

    // 1. Initial Local State Loading
    (0,a.useEffect)(()=>{
      try{
        let e="2026_09_16_CLOUDFLARE_V2";
        if(localStorage.getItem("simple_eng_data_version")!==e){
          localStorage.removeItem("simple_eng_work_orders");
          localStorage.removeItem("simple_eng_work_orders_v2");
          localStorage.removeItem("simple_eng_work_orders_v3");
          localStorage.removeItem("simple_eng_work_orders_v4");
          localStorage.setItem("simple_eng_data_version",e);
          localStorage.setItem("simple_eng_work_orders_v5",JSON.stringify([]));
          b([]);
        } else {
          let raw=localStorage.getItem("simple_eng_work_orders_v5");
          if(raw){
            try {
              let parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                b(parsed.map(item => (0,d._f)(item, item.history || item.status_history || [])).filter(Boolean));
              } else {
                b([]);
              }
            } catch(e) {
              b([]);
            }
          } else {
            b([]);
          }
        }
        let t=localStorage.getItem("simple_eng_settings");
        if(t) try { m(JSON.parse(t)); } catch(e){ m(i.jM); } else m(i.jM);
        let r=localStorage.getItem("simple_eng_departments");
        if(r) try { h(JSON.parse(r)); } catch(e){}
        let o=localStorage.getItem("simple_eng_technicians");
        if(o) try { w(JSON.parse(o)); } catch(e){}
        let a=localStorage.getItem("simple_eng_users_v3");
        if(a){
          try {
            let parsed = JSON.parse(a);
            if (Array.isArray(parsed)) {
              let e=parsed.map(e=>"ADMIN"===e.role||"mecolomboadmin"===e.username?{...e,password:"adminme1234"}:e);
              N(e);
            }
          } catch(e){}
        } else {
          N(i.rp);
          localStorage.setItem("simple_eng_users_v3",JSON.stringify(i.rp));
        }
        let storedUser=localStorage.getItem("simple_eng_current_user");
        if(storedUser){
          try {
            let e=JSON.parse(storedUser);
            if(e&&("ADMIN"===e.role||"mecolomboadmin"===e.username)) e.password="adminme1234";
            v(e);
          } catch(e){}
        } else {
          v(null);
        }
        k(l.getMuted());
      }catch(err){
        console.warn("Error loading stored engineering data:",err);
      }finally{
        n(!0);
      }
    },[]);

    // 2. State persistence
    (0,a.useEffect)(()=>{
      if(r){
        try{
          localStorage.setItem("simple_eng_settings",JSON.stringify(u));
          localStorage.setItem("simple_eng_departments",JSON.stringify(p));
          localStorage.setItem("simple_eng_technicians",JSON.stringify(f));
          localStorage.setItem("simple_eng_users_v3",JSON.stringify(y));
          if(S) localStorage.setItem("simple_eng_current_user",JSON.stringify(S)); else localStorage.removeItem("simple_eng_current_user");
          localStorage.setItem("simple_eng_work_orders_v5",JSON.stringify(I || []));
        }catch(e){
          console.warn("Storage notice:",e);
        }
      }
    },[r,u,p,f,y,S,I]);

    // 3. Fast Cloudflare D1 Sync Polling (Every 3 seconds)
    (0,a.useEffect)(()=>{
      if(!r) return;
      g.init();
      let isActive = true;

      let syncFromCloudflare = async () => {
        try {
          let [orders, users] = await Promise.all([(0, d.n5)(), (0, d.M1)()]);
          if (!isActive) return;

          if (orders !== null && Array.isArray(orders)) {
            C(true);
            x(new Date());
            b(prev => {
              let safePrev = Array.isArray(prev) ? prev : [];
              let canAlert = (S?.role === "ENGINEERING" || S?.role === "ADMIN" || S?.role === "TECHNICIAN");
              if (canAlert) {
                orders.filter(t => t && t.status === "NEW" && !safePrev.some(p => p && p.workOrderNumber === t.workOrderNumber)).forEach(t => {
                  g.sendNewTicketAlert(t);
                });
              }
              return orders.filter(Boolean).sort((a, b) => new Date(b.reportedAt || 0).getTime() - new Date(a.reportedAt || 0).getTime());
            });
          }

          if (users !== null && Array.isArray(users)) {
            N(prev => {
              let map = new Map();
              let safePrev = Array.isArray(prev) ? prev : [];
              i.rp.forEach(u => u && u.email && map.set(u.email.toLowerCase(), u));
              safePrev.forEach(u => u && u.email && map.set(u.email.toLowerCase(), u));
              users.forEach(u => u && u.email && map.set(u.email.toLowerCase(), u));
              return Array.from(map.values()).map(u => "ADMIN" === u.role || "mecolomboadmin" === u.username ? { ...u, password: "adminme1234" } : u);
            });
          }
        } catch (err) {
          console.warn("Cloudflare background sync notice:", err);
          if (isActive) C(false);
        }
      };

      syncFromCloudflare();
      let timer = setInterval(syncFromCloudflare, 3000);

      return () => {
        isActive = false;
        clearInterval(timer);
      };
    },[r, S?.role]);

    let D = Array.isArray(I) && I.some(e => e && "NEW" === e.status);

    (0,a.useEffect)(()=>{
      if(!r) return;
      let e = (S?.role === "ENGINEERING" || S?.role === "ADMIN" || S?.role === "TECHNICIAN");
      if (D && u && u.soundAlertEnabled && !A && e) {
        l.startLoopingAlert();
      } else {
        l.stopAlert();
      }
      return () => { l.stopAlert(); };
    },[r, D, u?.soundAlertEnabled, A, S?.role]);

    return (0,o.jsx)(_.Provider,{
      value:{
        workOrders: Array.isArray(I) ? I : [],
        users: Array.isArray(y) ? y : [],
        departments: Array.isArray(p) ? p : [],
        technicians: Array.isArray(f) ? f : [],
        settings: u || i.jM,
        currentUser: S,
        isLoaded: r,
        logout:()=>{ v(null); localStorage.removeItem("simple_eng_current_user"); },
        hasUnacceptedNewOrders: D,
        isMuted: A,
        toggleMute:()=>{ let e=!A; k(e); l.setMuted(e); },
        enableAudio:()=>l.unlockAudio(),
        isCloudConnected: E,
        lastCloudSync: O,
        setCurrentUser: v,
        switchUser: e => { let t=(y||[]).find(t=>t.id===e); if(t) v(t); },
        createWorkOrder: e => {
          let year = new Date().getFullYear(),
              safeI = Array.isArray(I) ? I : [],
              seqs = safeI.map(item => {
                let wo = item && (item.workOrderNumber || item.work_order_number);
                if (typeof wo === "string") {
                  let p = wo.split("-");
                  return p.length === 3 ? parseInt(p[2], 10) : 0;
                }
                return 0;
              }).filter(n => !isNaN(n) && n > 0),
              nextNum = seqs.length > 0 ? Math.max(...seqs) + 1 : 60,
              woNum = "WO-" + year + "-" + String(nextNum).padStart(4, "0"),
              now = new Date().toISOString(),
              uuid = (0,c.l)(),
              newOrder = {
                id: uuid,
                workOrderNumber: woNum,
                hotelName: e.hotelName || (u && u.hotelName) || "ME Colombo",
                reportedBy: e.reportedBy || "Staff",
                reportedById: e.reportedById || S?.id || null,
                departmentName: e.departmentName || "Engineering",
                location: e.location || "",
                roomNumber: e.roomNumber || null,
                category: e.category || "General",
                title: e.title || "Maintenance Request",
                description: e.description || "",
                photoUrl: e.photoUrl || null,
                afterPhotoUrl: null,
                guestAffected: !!e.guestAffected,
                priority: e.priority || "P3",
                suggestedPriority: e.suggestedPriority || null,
                priorityRationale: e.priorityRationale || null,
                status: "NEW",
                reportedAt: now,
                createdAt: now,
                updatedAt: now,
                history: [{
                  id: (0,c.l)(),
                  workOrderId: uuid,
                  status: "NEW",
                  timestamp: now,
                  actorName: (e.reportedBy || "Staff") + " (" + (e.departmentName || "Engineering") + ")",
                  note: "Request created and sent to Engineering"
                }]
              };
          b(prev => [newOrder, ...(Array.isArray(prev) ? prev : [])]);
          (0,d.oG)(newOrder);
          return newOrder;
        },
        acceptWorkOrder: (e,t) => {
          let actor = t || S?.name || "Staff", now = new Date().toISOString();
          b(prev => (Array.isArray(prev) ? prev : []).map(item => {
            if(item && item.id === e){
              let curHist = Array.isArray(item.history) ? item.history : [];
              let upd = {
                ...item,
                status: "ACCEPTED",
                acceptedAt: now,
                acceptedBy: actor,
                updatedAt: now,
                history: [...curHist, { id: (0,c.l)(), workOrderId: e, status: "ACCEPTED", timestamp: now, actorName: actor, note: "Accepted request by Engineering" }]
              };
              (0,d.oG)(upd);
              return upd;
            }
            return item;
          }));
        },
        assignTechnician: (e,t,r) => {
          let now = new Date().toISOString();
          b(prev => (Array.isArray(prev) ? prev : []).map(item => {
            if(item && item.id === e){
              let curHist = Array.isArray(item.history) ? item.history : [];
              let upd = {
                ...item,
                assignedTechnicianId: t,
                assignedTechnicianName: r,
                updatedAt: now,
                history: [...curHist, { id: (0,c.l)(), workOrderId: e, status: item.status, timestamp: now, actorName: S?.name || "Staff", note: "Assigned to technician " + r }]
              };
              (0,d.oG)(upd);
              return upd;
            }
            return item;
          }));
        },
        startWork: e => {
          let now = new Date().toISOString();
          b(prev => (Array.isArray(prev) ? prev : []).map(item => {
            if(item && item.id === e){
              let curHist = Array.isArray(item.history) ? item.history : [];
              let upd = {
                ...item,
                status: "IN_PROGRESS",
                startedAt: item.startedAt || now,
                updatedAt: now,
                history: [...curHist, { id: (0,c.l)(), workOrderId: e, status: "IN_PROGRESS", timestamp: now, actorName: S?.name || "Staff", note: "Technician started work" }]
              };
              (0,d.oG)(upd);
              return upd;
            }
            return item;
          }));
        },
        setWaiting: (e,t) => {
          let now = new Date().toISOString();
          b(prev => (Array.isArray(prev) ? prev : []).map(item => {
            if(item && item.id === e){
              let curHist = Array.isArray(item.history) ? item.history : [];
              let upd = {
                ...item,
                status: "WAITING",
                waitingAt: now,
                waitingReason: t,
                updatedAt: now,
                history: [...curHist, { id: (0,c.l)(), workOrderId: e, status: "WAITING", timestamp: now, actorName: S?.name || "Staff", note: "Put on hold: " + t }]
              };
              (0,d.oG)(upd);
              return upd;
            }
            return item;
          }));
        },
        resumeWork: e => {
          let now = new Date().toISOString();
          b(prev => (Array.isArray(prev) ? prev : []).map(item => {
            if(item && item.id === e){
              let curHist = Array.isArray(item.history) ? item.history : [];
              let upd = {
                ...item,
                status: "IN_PROGRESS",
                updatedAt: now,
                history: [...curHist, { id: (0,c.l)(), workOrderId: e, status: "IN_PROGRESS", timestamp: now, actorName: S?.name || "Staff", note: "Resumed work" }]
              };
              (0,d.oG)(upd);
              return upd;
            }
            return item;
          }));
        },
        completeWork: (e,t,r,o) => {
          let now = new Date().toISOString();
          b(prev => (Array.isArray(prev) ? prev : []).map(item => {
            if(item && item.id === e){
              let curHist = Array.isArray(item.history) ? item.history : [];
              let upd = {
                ...item,
                status: "COMPLETED",
                completedAt: now,
                workDone: t,
                completionNote: r,
                afterPhotoUrl: o,
                updatedAt: now,
                history: [...curHist, { id: (0,c.l)(), workOrderId: e, status: "COMPLETED", timestamp: now, actorName: S?.name || "Staff", note: "Work completed: " + t }]
              };
              (0,d.oG)(upd);
              return upd;
            }
            return item;
          }));
        },
        closeWorkOrder: (e,t,r) => {
          let now = new Date().toISOString(), actor = t || S?.name || "Staff";
          b(prev => (Array.isArray(prev) ? prev : []).map(item => {
            if(item && item.id === e){
              let curHist = Array.isArray(item.history) ? item.history : [];
              let upd = {
                ...item,
                status: "CLOSED",
                closedAt: now,
                closedBy: actor,
                updatedAt: now,
                history: [...curHist, { id: (0,c.l)(), workOrderId: e, status: "CLOSED", timestamp: now, actorName: actor, note: r ? "Verified & closed: " + r : "Verified & closed request" }]
              };
              (0,d.oG)(upd);
              return upd;
            }
            return item;
          }));
        },
        deleteWorkOrder: (e,t) => {
          b(prev => (Array.isArray(prev) ? prev : []).filter(item => item && item.id !== e && item.workOrderNumber !== e && (!t || item.workOrderNumber !== t)));
          (0,d.xN)(e,t);
        },
        updateSettings: e => { m(prev => ({...(prev || {}), ...e})); },
        addDepartment: e => { let t={...e, id:"dept-"+Date.now()}; h(prev=>[...(Array.isArray(prev)?prev:[]),t]); },
        deleteDepartment: e => { h(prev=>(Array.isArray(prev)?prev:[]).filter(t=>t.id!==e)); },
        addTechnician: e => { let t={...e, id:"tech-"+Date.now()}; w(prev=>[...(Array.isArray(prev)?prev:[]),t]); },
        toggleTechnician: e => { w(prev=>(Array.isArray(prev)?prev:[]).map(t=>t.id===e?{...t,active:!t.active}:t)); },
        addUser: e => { let t={...e, id:(0,c.l)()}; N(prev=>[...(Array.isArray(prev)?prev:[]),t]); (0,d.pk)(t); },
        deleteUser: e => { N(prev=>(Array.isArray(prev)?prev:[]).filter(t=>t.id!==e)); (0,d.mY)(e); },
        toggleUser: e => { N(prev=>(Array.isArray(prev)?prev:[]).map(t=>t.id===e?{...t,active:!t.active}:t)); (0,d.pk)(e); },
        resetToDemoData: () => { m(i.jM); h(i.gm); w(i.Y4); N(i.rp); v(null); b([]); localStorage.clear(); }
      },
      children: t
    });
  }

  function f(){
    let e=(0,a.useContext)(_);
    if(!e) throw Error("useHotelEngineering must be used within an EngineeringProvider");
    return e;
  }
},
62890:(e,t,r)=>{
  r.d(t,{$:()=>n,N:()=>l});
  let a="https://me-engineering-api.madhushan875.workers.dev",
      n=!0,
      l={apiUrl:a,isCloudflare:!0};
},
66779:(e,t,r)=>{
  function o(){
    return "undefined"!=typeof crypto&&"function"==typeof crypto.randomUUID
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){
          let t=16*Math.random()|0;
          return ("x"===e?t:3&t|8).toString(16);
        });
  }
  function a(e){
    return !!e&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e);
  }
  r.d(t,{a:()=>a,l:()=>o});
}
}]);`;

// Write to out/, public/, and android/
fs.writeFileSync(chunkFile, newChunkCode, 'utf8');
console.log('✅ Updated:', chunkFile);

fs.writeFileSync(publicChunkFile, newChunkCode, 'utf8');
console.log('✅ Updated:', publicChunkFile);

fs.writeFileSync(androidChunkFile, newChunkCode, 'utf8');
console.log('✅ Updated:', androidChunkFile);
