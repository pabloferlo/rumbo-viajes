import React, { useEffect, useMemo, useState } from 'react';
import {
  Plane, Plus, Wallet, Users, CalendarDays, Luggage, LayoutDashboard,
  LogOut, ArrowUpRight, ArrowDownLeft, Check, X, MapPin, Clock3,
  CircleDollarSign, ChevronRight, Menu, Trash2, Sparkles, UserRoundPlus,
  Sun, CloudSun, Moon, ListChecks, Compass
} from 'lucide-react';
import { supabase, configured } from './lib/supabase';

const demoTrips = [
  { id:'demo-1', name:'Escapada a Lisboa', destination:'Lisboa, Portugal', start_date:'2026-11-12', end_date:'2026-11-16', currency:'EUR', emoji:'🌞', members:5 },
  { id:'demo-2', name:'Montaña con amigos', destination:'Picos de Europa', start_date:'2026-12-04', end_date:'2026-12-07', currency:'EUR', emoji:'🏔️', members:4 },
];
const demoExpenses = [
  { id:'e1', description:'Alojamiento', amount:420, paid_by:'Alex', category:'Estancia', date:'2026-11-12', split_names:['Alex','Lucía','Marcos','Sara','Dani'] },
  { id:'e2', description:'Cena de bienvenida', amount:86.5, paid_by:'Lucía', category:'Comida', date:'2026-11-12', split_names:['Alex','Lucía','Marcos','Sara','Dani'] },
  { id:'e3', description:'Entradas museo', amount:55, paid_by:'Marcos', category:'Actividades', date:'2026-11-13', split_names:['Alex','Lucía','Marcos','Sara','Dani'] },
];
const demoPeople = ['Alex','Lucía','Marcos','Sara','Dani'];
const money = n => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const fmtDate = s => s ? new Date(`${s}T12:00:00`).toLocaleDateString('es-ES',{day:'numeric',month:'short'}) : 'Por decidir';
const initials = s => (s||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();

function balances(expenses, people) {
  const net = Object.fromEntries(people.map(p=>[p,0]));
  expenses.forEach(e => {
    const names = e.split_names?.length ? e.split_names : people;
    const amount = Number(e.amount)||0;
    if (net[e.paid_by] !== undefined) net[e.paid_by] += amount;
    names.forEach(n => { if (net[n] !== undefined) net[n] -= amount / names.length; });
  });
  return net;
}
function settle(expenses, people) {
  const net = balances(expenses, people);
  const debtors = Object.entries(net).filter(([,v])=>v < -0.009).map(([name,amount])=>({name,amount:-amount})).sort((a,b)=>b.amount-a.amount);
  const creditors = Object.entries(net).filter(([,v])=>v > 0.009).map(([name,amount])=>({name,amount})).sort((a,b)=>b.amount-a.amount);
  const result=[];
  let i=0,j=0;
  while(i<debtors.length && j<creditors.length) {
    const amount=Math.min(debtors[i].amount,creditors[j].amount);
    if(amount>0.009) result.push({from:debtors[i].name,to:creditors[j].name,amount});
    debtors[i].amount-=amount; creditors[j].amount-=amount;
    if(debtors[i].amount<0.01)i++;
    if(creditors[j].amount<0.01)j++;
  }
  return {net, transfers:result};
}

function AuthScreen({ onDemo }) {
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [name,setName]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function submit(e) {
    e.preventDefault(); setError('');
    if(!configured){setError('Configura primero las variables de Supabase en el archivo .env. Puedes entrar a la demo mientras tanto.');return;}
    setBusy(true);
    try {
      if(mode==='signup') {
        const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
        if(error) throw error;
        setError('Cuenta creada. Si tienes la confirmación por correo activada, revisa tu bandeja de entrada.');
      } else {
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
      }
    } catch(err){setError(err.message||'No se pudo completar la operación.');}
    finally{setBusy(false);}
  }
  return <div className="auth-shell">
    <div className="auth-art">
      <div className="brand brand-light"><span className="brand-icon"><Plane size={20}/></span> rumbo<span className="brand-dot">.</span></div>
      <div className="art-copy"><span className="eyebrow light-eyebrow">MENOS CUENTAS, MÁS AVENTURAS</span><h1>Los mejores viajes<br/>se hacen en equipo.</h1><p>Todo vuestro viaje en un solo lugar: gastos, planes, gente y esa lista de cosas que siempre se olvidan.</p></div>
      <div className="art-stats"><div><strong>01</strong><span>Organizad</span></div><div><strong>02</strong><span>Compartid</span></div><div><strong>03</strong><span>Disfrutad</span></div></div>
      <div className="floating-card"><span>✈️</span><div><b>Próxima aventura</b><small>Todo listo para salir</small></div><Check size={18}/></div>
    </div>
    <div className="auth-panel"><div className="auth-top"><span className="muted">¿Primera vez por aquí?</span><button className="text-button" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?'Crear cuenta':'Iniciar sesión'}</button></div>
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">TU PRÓXIMA AVENTURA</span><h2>{mode==='login'?'Qué alegría verte.':'Empieza a viajar mejor.'}</h2><p className="muted">{mode==='login'?'Entra en tu espacio de viajes compartidos.':'Crea tu cuenta y organiza tu primer viaje.'}</p>
        {mode==='signup'&&<label>Nombre<input value={name} onChange={e=>setName(e.target.value)} placeholder="¿Cómo te llamas?" required/></label>}
        <label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" required/></label>
        <label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength="6" required/></label>
        {error&&<div className="notice">{error}</div>}
        <button className="primary-button full" disabled={busy}>{busy?'Un momento…':mode==='login'?'Entrar en mi cuenta':'Crear mi cuenta'} <ChevronRight size={17}/></button>
        <div className="or-line"><span>o prueba primero</span></div>
        <button type="button" className="secondary-button full" onClick={onDemo}>Explorar la demo <ArrowUpRight size={16}/></button>
        <p className="tiny-note">Al continuar, aceptas usar Rumbo para organizar tus viajes con responsabilidad.</p>
      </form>
    </div>
  </div>;
}

function App() {
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [demo,setDemo]=useState(false);
  const [page,setPage]=useState('overview');
  const [trips,setTrips]=useState([]);
  const [tripId,setTripId]=useState(null);
  const [expenses,setExpenses]=useState([]);
  const [people,setPeople]=useState(demoPeople);
  const [activities,setActivities]=useState([]);
  const [packing,setPacking]=useState([]);
  const [groups,setGroups]=useState([]);
  const [loading,setLoading]=useState(true);
  const [mobileNav,setMobileNav]=useState(false);
  const [modal,setModal]=useState('');
  const [toast,setToast]=useState('');
  const [expenseForm,setExpenseForm]=useState({description:'',amount:'',paid_by:'',category:'Comida',date:new Date().toISOString().slice(0,10),split_names:[]});
  const [tripForm,setTripForm]=useState({name:'',destination:'',start_date:'',end_date:'',currency:'EUR',emoji:'🌍'});
  const [personName,setPersonName]=useState('');
  const [activityForm,setActivityForm]=useState({title:'',day:'1',time:'10:00',location:'',category:'Visita'});
  const [itemName,setItemName]=useState('');
  const [groupForm,setGroupForm]=useState({name:'',members:[]});

  useEffect(()=>{
    if(!configured){setLoading(false);return;}
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{
    if(demo){setTrips(demoTrips);setTripId(x=>x||'demo-1');setExpenses(demoExpenses);setPeople(demoPeople);setActivities([
      {id:'a1',title:'Llegada y dejar maletas',day:'1',time:'12:00',location:'Apartamento',category:'Logística'},
      {id:'a2',title:'Paseo por Alfama',day:'1',time:'16:00',location:'Alfama',category:'Visita'},
      {id:'a3',title:'Cena en Time Out Market',day:'1',time:'20:30',location:'Mercado da Ribeira',category:'Comida'},
      {id:'a4',title:'Tranvía 28 y miradores',day:'2',time:'10:00',location:'Graça',category:'Visita'},
    ]);setPacking([{id:'p1',name:'Documentación',checked:false,category:'Imprescindible'},{id:'p2',name:'Cargador del móvil',checked:true,category:'Electrónica'},{id:'p3',name:'Gafas de sol',checked:false,category:'Accesorios'},{id:'p4',name:'Zapatillas cómodas',checked:false,category:'Ropa'}]);setGroups([{id:'g1',name:'Los exploradores',members:['Alex','Lucía','Marcos']},{id:'g2',name:'Team sobremesa',members:['Sara','Dani']}]);setLoading(false);}
  },[demo]);
  useEffect(()=>{
    if(!session?.user||!configured){if(!session)setLoading(false);return;}
    let alive=true;
    (async()=>{
      setLoading(true);
      const {data:prof}=await supabase.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
      if(alive)setProfile(prof||{full_name:session.user.user_metadata?.full_name,email:session.user.email});
      const {data:memberships}=await supabase.from('trip_members').select('trip_id, role').eq('user_id',session.user.id);
      const ids=(memberships||[]).map(m=>m.trip_id);
      if(!ids.length){if(alive){setTrips([]);setTripId(null);setLoading(false);}return;}
      const {data:tripRows,error}=await supabase.from('trips').select('*').in('id',ids).order('start_date',{ascending:true});
      if(error) console.error(error);
      if(alive){setTrips(tripRows||[]);setTripId(cur=>ids.includes(cur)?cur:(tripRows?.[0]?.id||null));setLoading(false);}
    })();
    return ()=>{alive=false;};
  },[session]);
  useEffect(()=>{
    if(!tripId||tripId.startsWith('demo-')||!configured||demo)return;
    let alive=true;
    (async()=>{
      const [ex,mem,act,pack,grp]=await Promise.all([
        supabase.from('expenses').select('*').eq('trip_id',tripId).order('expense_date',{ascending:false}),
        supabase.from('trip_members').select('user_id, display_name, profiles(full_name)').eq('trip_id',tripId),
        supabase.from('activities').select('*').eq('trip_id',tripId).order('day_number').order('start_time'),
        supabase.from('packing_items').select('*').eq('trip_id',tripId).order('created_at'),
        supabase.from('trip_groups').select('*, group_members(user_id, display_name)').eq('trip_id',tripId)
      ]);
      if(!alive)return;
      setExpenses((ex.data||[]).map(e=>({...e,paid_by:e.paid_by_name||e.paid_by,split_names:e.split_names||[]})));
      setPeople((mem.data||[]).map(m=>m.display_name||m.profiles?.full_name||m.profiles?.email||'Participante'));
      setActivities((act.data||[]).map(a=>({...a,day:String(a.day_number),time:a.start_time||'09:00',location:a.location||''})));
      setPacking((pack.data||[]).map(p=>({...p,checked:p.is_checked})));
      setGroups((grp.data||[]).map(g=>({...g,members:(g.group_members||[]).map(m=>m.display_name||'Participante')})));
    })();
    return ()=>{alive=false;};
  },[tripId,session,demo]);
  const activeTrip=trips.find(t=>t.id===tripId)||trips[0]||null;
  const currentName=profile?.full_name||session?.user?.user_metadata?.full_name||session?.user?.email?.split('@')[0]||(demo?'Alex':'');
  const {net,transfers}=useMemo(()=>settle(expenses,people),[expenses,people]);
  const totalSpent=expenses.reduce((s,e)=>s+Number(e.amount||0),0);
  const notify=msg=>{setToast(msg);setTimeout(()=>setToast(''),2800);};
  async function logout(){if(configured&&session)await supabase.auth.signOut();setDemo(false);setSession(null);setPage('overview');}
  async function createTrip(e){
    e.preventDefault();
    if(demo){const t={...tripForm,id:`demo-${Date.now()}`,members:1};setTrips(p=>[...p,t]);setTripId(t.id);setExpenses([]);setPeople([currentName||'Tú']);setActivities([]);setPacking([]);setGroups([]);setModal('');setPage('overview');notify('¡Nuevo viaje creado!');return;}
    if(!session){notify('Inicia sesión para crear viajes.');return;}
    const {data,error}=await supabase.from('trips').insert({...tripForm,created_by:session.user.id}).select().single();
    if(error){notify(error.message);return;}
    const {error:memberError}=await supabase.from('trip_members').insert({trip_id:data.id,user_id:session.user.id,display_name:currentName||session.user.email,role:'owner'});
    if(memberError){notify('Viaje creado, pero no se pudo añadir el creador como participante: '+memberError.message);return;}
    setTrips(p=>[...p,data]);setTripId(data.id);setPeople([currentName||'Tú']);setExpenses([]);setActivities([]);setPacking([]);setGroups([]);setModal('');setPage('overview');notify('¡Nuevo viaje creado!');
  }
  async function addExpense(e){
    e.preventDefault();const amount=Number(expenseForm.amount);
    if(!expenseForm.description.trim()||!amount||amount<=0){notify('Añade una descripción y un importe válido.');return;}
    const split=expenseForm.split_names.length?expenseForm.split_names:people;
    const row={trip_id:tripId,description:expenseForm.description,amount,category:expenseForm.category,expense_date:expenseForm.date,paid_by_name:expenseForm.paid_by||people[0],split_names:split,created_by:session?.user?.id||null};
    if(!demo&&session){const {data,error}=await supabase.from('expenses').insert(row).select().single();if(error){notify(error.message);return;}setExpenses(p=>[{...data,paid_by:data.paid_by_name},...p]);}
    else setExpenses(p=>[{...row,id:`e${Date.now()}`,paid_by:row.paid_by_name},...p]);
    setModal('');setExpenseForm({description:'',amount:'',paid_by:people[0]||'',category:'Comida',date:new Date().toISOString().slice(0,10),split_names:[]});notify('Gasto añadido y cuentas recalculadas.');
  }
  async function addPerson(e){
    e.preventDefault();if(!personName.trim())return;
    if(!demo&&session){const {error}=await supabase.from('trip_members').insert({trip_id:tripId,display_name:personName.trim(),role:'member',invited_by:session.user.id});if(error){notify(error.message);return;}}
    setPeople(p=>[...p,personName.trim()]);setPersonName('');setModal('');notify('Participante añadido.');
  }
  async function addActivity(e){
    e.preventDefault();if(!activityForm.title.trim())return;
    const row={trip_id:tripId,title:activityForm.title,day_number:Number(activityForm.day)||1,start_time:activityForm.time,location:activityForm.location,category:activityForm.category,created_by:session?.user?.id||null};
    if(!demo&&session){const {data,error}=await supabase.from('activities').insert(row).select().single();if(error){notify(error.message);return;}setActivities(p=>[...p,{...data,day:String(data.day_number),time:data.start_time},]);}
    else setActivities(p=>[...p,{...row,id:`a${Date.now()}`,day:String(row.day_number),time:row.start_time}]);
    setModal('');setActivityForm({title:'',day:'1',time:'10:00',location:'',category:'Visita'});notify('Actividad añadida al itinerario.');
  }
  async function addPacking(e){
    e.preventDefault();if(!itemName.trim())return;
    const row={trip_id:tripId,name:itemName.trim(),category:'General',is_checked:false,created_by:session?.user?.id||null};
    if(!demo&&session){const {data,error}=await supabase.from('packing_items').insert(row).select().single();if(error){notify(error.message);return;}setPacking(p=>[...p,{...data,checked:data.is_checked}]);}
    else setPacking(p=>[...p,{...row,id:`p${Date.now()}`,checked:false}]);
    setItemName('');setModal('');
  }
  async function togglePacking(item){
    const checked=!item.checked;
    if(!demo&&session){const {error}=await supabase.from('packing_items').update({is_checked:checked}).eq('id',item.id);if(error){notify(error.message);return;}}
    setPacking(p=>p.map(x=>x.id===item.id?{...x,checked}:x));
  }
  async function addGroup(e){
    e.preventDefault();if(!groupForm.name.trim()||!groupForm.members.length)return;
    if(!demo&&session){
      const {data,error}=await supabase.from('trip_groups').insert({trip_id:tripId,name:groupForm.name,created_by:session.user.id}).select().single();
      if(error){notify(error.message);return;}
      const chosen=people.filter(n=>groupForm.members.includes(n));
      const {error:gmError}=await supabase.from('group_members').insert(chosen.map(n=>({group_id:data.id,display_name:n})));
      if(gmError){notify(gmError.message);return;}
      setGroups(p=>[...p,{...data,members:chosen}]);
    }else setGroups(p=>[...p,{id:`g${Date.now()}`,name:groupForm.name,members:people.filter(n=>groupForm.members.includes(n))}]);
    setModal('');setGroupForm({name:'',members:[]});notify('Grupo creado.');
  }
  async function deleteExpense(exp){
    if(!confirm(`¿Eliminar el gasto «${exp.description}»?`))return;
    if(!demo&&session){const {error}=await supabase.from('expenses').delete().eq('id',exp.id);if(error){notify(error.message);return;}}
    setExpenses(p=>p.filter(x=>x.id!==exp.id));notify('Gasto eliminado.');
  }
  const nav=[{id:'overview',label:'Resumen',icon:LayoutDashboard},{id:'expenses',label:'Gastos y cuentas',icon:Wallet},{id:'people',label:'Participantes',icon:Users},{id:'itinerary',label:'Itinerario',icon:CalendarDays},{id:'packing',label:'Lista de maleta',icon:Luggage}];
  const pageTitle=nav.find(n=>n.id===page)?.label||'Resumen';
  const spentPct=activeTrip?.budget?Math.min(100,totalSpent/activeTrip.budget*100):0;
  if(loading)return <div className="loading-screen"><span className="brand-icon"><Plane size={20}/></span><p>Preparando tu próxima aventura…</p></div>;
  if(!session&&!demo)return <AuthScreen onDemo={()=>{setDemo(true);setPage('overview');}}/>;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'sidebar-open':''}`}>
      <div className="brand"><span className="brand-icon"><Plane size={20}/></span> rumbo<span className="brand-dot">.</span></div>
      <div className="workspace-label">TU ESPACIO <button className="icon-button tiny" title="Crear viaje" onClick={()=>{setTripForm({name:'',destination:'',start_date:'',end_date:'',currency:'EUR',emoji:'🌍'});setModal('trip')}}><Plus size={15}/></button></div>
      <div className="trip-switcher">
        {trips.map(t=><button key={t.id} className={`trip-option ${t.id===tripId?'selected':''}`} onClick={()=>{setTripId(t.id);setPage('overview');setMobileNav(false);}}><span className="trip-emoji">{t.emoji||'✈️'}</span><span className="trip-option-copy"><b>{t.name}</b><small>{t.destination||'Destino por decidir'}</small></span>{t.id===tripId&&<span className="selected-dot"/>}</button>)}
        <button className="new-trip-link" onClick={()=>{setTripForm({name:'',destination:'',start_date:'',end_date:'',currency:'EUR',emoji:'🌍'});setModal('trip')}}><Plus size={15}/> Crear un viaje</button>
      </div>
      {activeTrip&&<><div className="workspace-label nav-label">VIAJE ACTUAL</div><nav className="main-nav">{nav.map(n=><button key={n.id} className={page===n.id?'nav-active':''} onClick={()=>{setPage(n.id);setMobileNav(false)}}><n.icon size={18}/><span>{n.label}</span>{n.id==='expenses'&&<span className="nav-count">{expenses.length}</span>}</button>)}</nav>
      <div className="sidebar-trip-card"><span className="mini-sun">{activeTrip.emoji||'🌍'}</span><b>{activeTrip.destination||'Destino sorpresa'}</b><span>{fmtDate(activeTrip.start_date)} — {fmtDate(activeTrip.end_date)}</span><div className="trip-card-people"><div className="avatar-stack">{people.slice(0,4).map((p,i)=><span key={p} className={`avatar av-${i%5}`}>{initials(p)}</span>)}</div><small>{people.length} participantes</small></div></div></>}
      <div className="sidebar-bottom"><div className="profile-row"><span className="profile-avatar">{initials(currentName)}</span><span className="profile-info"><b>{currentName||'Viajero'}</b><small>{demo?'Modo demostración':session?.user?.email||'Cuenta personal'}</small></span><button className="icon-button" title="Cerrar sesión" onClick={logout}><LogOut size={16}/></button></div><div className="sidebar-footnote">Hecho para compartir camino <span>♥</span></div></div>
    </aside>
    {mobileNav&&<button className="mobile-scrim" onClick={()=>setMobileNav(false)} aria-label="Cerrar menú"/>}
    <main className="main-content">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><span className="breadcrumb">Mis viajes <ChevronRight size={13}/> <b>{pageTitle}</b></span></div><div className="topbar-right"><span className="sync-status"><span/> {demo?'Demo interactiva':'Espacio privado'}</span><button className="top-avatar" title={currentName}>{initials(currentName)}</button></div></header>
      {!activeTrip?<section className="empty-trips"><div className="empty-illustration">🧭</div><span className="eyebrow">TODO EMPIEZA AQUÍ</span><h1>¿A dónde os lleva el próximo plan?</h1><p>Crea un viaje para reunir a tu gente, controlar gastos y organizar cada detalle.</p><button className="primary-button" onClick={()=>setModal('trip')}><Plus size={17}/> Crear mi primer viaje</button></section>:
      <div className="page-wrap">
        {demo&&<div className="demo-banner"><Sparkles size={16}/><span><b>Estás explorando la demo.</b> Prueba gastos, participantes, itinerario y maleta. Los datos de demostración no se guardan en Supabase.</span><button onClick={()=>{setDemo(false);setTrips([]);setTripId(null);setPage('overview')}}><X size={15}/></button></div>}
        {page==='overview'&&<Overview activeTrip={activeTrip} people={people} expenses={expenses} activities={activities} packing={packing} totalSpent={totalSpent} net={net} transfers={transfers} onNavigate={setPage} onModal={setModal} onDelete={deleteExpense} spentPct={spentPct}/>}
        {page==='expenses'&&<ExpensesPage expenses={expenses} people={people} totalSpent={totalSpent} net={net} transfers={transfers} onAdd={()=>{setExpenseForm({description:'',amount:'',paid_by:people[0]||'',category:'Comida',date:new Date().toISOString().slice(0,10),split_names:[...people]});setModal('expense')}} onDelete={deleteExpense}/>}
        {page==='people'&&<PeoplePage people={people} groups={groups} onAdd={()=>setModal('person')} onGroup={()=>{setGroupForm({name:'',members:[]});setModal('group')}}/>}
        {page==='itinerary'&&<ItineraryPage activities={activities} trip={activeTrip} onAdd={()=>setModal('activity')}/>}
        {page==='packing'&&<PackingPage items={packing} onToggle={togglePacking} onAdd={()=>setModal('packing')}/>}
      </div>}
    </main>
    {toast&&<div className="toast"><Check size={16}/>{toast}</div>}
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal('')}}><div className="modal-card"><div className="modal-head"><div><span className="eyebrow">RUMBO · TU VIAJE</span><h2>{({trip:'Crear un viaje',expense:'Añadir un gasto',person:'Añadir participante',activity:'Nueva actividad',packing:'Añadir a la maleta',group:'Crear un grupo'})[modal]}</h2></div><button className="icon-button" onClick={()=>setModal('')}><X size={19}/></button></div>
      {modal==='trip'&&<form className="modal-form" onSubmit={createTrip}><label>Nombre del viaje<input required value={tripForm.name} onChange={e=>setTripForm({...tripForm,name:e.target.value})} placeholder="Ej. Verano en Italia"/></label><label>Destino<input value={tripForm.destination} onChange={e=>setTripForm({...tripForm,destination:e.target.value})} placeholder="¿A dónde vais?"/></label><div className="form-grid"><label>Fecha de ida<input type="date" value={tripForm.start_date} onChange={e=>setTripForm({...tripForm,start_date:e.target.value})}/></label><label>Fecha de vuelta<input type="date" min={tripForm.start_date||undefined} value={tripForm.end_date} onChange={e=>setTripForm({...tripForm,end_date:e.target.value})}/></label></div><label>Moneda<select value={tripForm.currency} onChange={e=>setTripForm({...tripForm,currency:e.target.value})}><option value="EUR">Euro (€)</option><option value="USD">Dólar ($)</option><option value="GBP">Libra (£)</option><option value="MXN">Peso mexicano ($)</option></select></label><button className="primary-button full">Crear viaje <ChevronRight size={17}/></button></form>}
      {modal==='expense'&&<form className="modal-form" onSubmit={addExpense}><label>¿En qué habéis gastado?<input required value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm,description:e.target.value})} placeholder="Ej. Cena del viernes"/></label><div className="form-grid"><label>Importe ({activeTrip.currency||'EUR'})<input required type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})} placeholder="0,00"/></label><label>Fecha<input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm,date:e.target.value})}/></label></div><label>¿Quién ha pagado?<select value={expenseForm.paid_by} onChange={e=>setExpenseForm({...expenseForm,paid_by:e.target.value})}>{people.map(p=><option key={p}>{p}</option>)}</select></label><label>Categoría<select value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm,category:e.target.value})}>{['Comida','Transporte','Estancia','Actividades','Compras','Otros'].map(c=><option key={c}>{c}</option>)}</select></label><div className="field-label">Repartir entre <span className="muted">· por defecto, todo el grupo</span></div><div className="check-grid">{people.map(p=><label className="check-option" key={p}><input type="checkbox" checked={expenseForm.split_names.includes(p)} onChange={e=>setExpenseForm({...expenseForm,split_names:e.target.checked?[...expenseForm.split_names,p]:expenseForm.split_names.filter(n=>n!==p)})}/>{p}</label>)}</div><button className="primary-button full">Guardar gasto <Wallet size={17}/></button></form>}
      {modal==='person'&&<form className="modal-form" onSubmit={addPerson}><p className="muted">Añade a las personas que participan en las cuentas de este viaje. En esta versión puedes añadir participantes por nombre.</p><label>Nombre del participante<input autoFocus required value={personName} onChange={e=>setPersonName(e.target.value)} placeholder="Ej. Paula"/></label><button className="primary-button full">Añadir participante <UserRoundPlus size={17}/></button></form>}
      {modal==='activity'&&<form className="modal-form" onSubmit={addActivity}><label>Nombre de la actividad<input required value={activityForm.title} onChange={e=>setActivityForm({...activityForm,title:e.target.value})} placeholder="Ej. Visitar el casco antiguo"/></label><div className="form-grid"><label>Día del viaje<input required type="number" min="1" value={activityForm.day} onChange={e=>setActivityForm({...activityForm,day:e.target.value})}/></label><label>Hora<input type="time" value={activityForm.time} onChange={e=>setActivityForm({...activityForm,time:e.target.value})}/></label></div><label>Lugar<input value={activityForm.location} onChange={e=>setActivityForm({...activityForm,location:e.target.value})} placeholder="Dirección o punto de encuentro"/></label><label>Tipo<select value={activityForm.category} onChange={e=>setActivityForm({...activityForm,category:e.target.value})}>{['Visita','Comida','Transporte','Logística','Aventura','Tiempo libre'].map(c=><option key={c}>{c}</option>)}</select></label><button className="primary-button full">Añadir al itinerario <CalendarDays size={17}/></button></form>}
      {modal==='packing'&&<form className="modal-form" onSubmit={addPacking}><label>¿Qué no puede faltar?<input autoFocus required value={itemName} onChange={e=>setItemName(e.target.value)} placeholder="Ej. Pasaporte"/></label><button className="primary-button full">Añadir a la lista <Luggage size={17}/></button></form>}
      {modal==='group'&&<form className="modal-form" onSubmit={addGroup}><label>Nombre del grupo<input required value={groupForm.name} onChange={e=>setGroupForm({...groupForm,name:e.target.value})} placeholder="Ej. Los aventureros"/></label><div className="field-label">Elige participantes</div><div className="check-grid">{people.map(p=><label className="check-option" key={p}><input type="checkbox" checked={groupForm.members.includes(p)} onChange={e=>setGroupForm({...groupForm,members:e.target.checked?[...groupForm.members,p]:groupForm.members.filter(n=>n!==p)})}/>{p}</label>)}</div><button className="primary-button full">Crear grupo <Users size={17}/></button></form>}
    </div></div>}
  </div>;
}

function SectionTitle({eyebrow,title,subtitle,action,actionLabel}){return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action&&<button className="primary-button" onClick={action}><Plus size={16}/>{actionLabel}</button>}</div>}
function Overview({activeTrip,people,expenses,activities,packing,totalSpent,net,transfers,onNavigate,onModal,onDelete,spentPct}){
 const days=activeTrip.start_date&&activeTrip.end_date?Math.max(1,Math.round((new Date(activeTrip.end_date)-new Date(activeTrip.start_date))/86400000)+1):null;
 const completed=packing.filter(p=>p.checked).length;
 return <><div className="welcome-row"><div><span className="eyebrow">TU AVENTURA, DE UN VISTAZO</span><h1>¡Hola, {activeTrip.name?.split(' ')[0]||'viajeros'}! <span>✌️</span></h1><p>Un buen viaje empieza con un plan compartido.</p></div><button className="primary-button" onClick={()=>onModal('expense')}><Plus size={17}/> Añadir gasto</button></div>
 <div className="hero-trip"><div className="hero-image"><div className="hero-sun"/><span className="hero-emoji">{activeTrip.emoji||'🌍'}</span><div className="hero-image-label"><span className="hero-label-dot"/> VIAJE EN GRUPO</div></div><div className="hero-details"><div className="hero-detail-top"><span className="trip-status"><span/> {activeTrip.start_date&&new Date(activeTrip.start_date)>new Date()?'PRÓXIMAMENTE':'VUESTRO VIAJE'}</span><button className="icon-button" title="Ver itinerario" onClick={()=>onNavigate('itinerary')}><ArrowUpRight size={18}/></button></div><h2>{activeTrip.name}</h2><p className="destination"><MapPin size={15}/>{activeTrip.destination||'Destino por decidir'}</p><div className="hero-meta"><span><CalendarDays size={15}/>{fmtDate(activeTrip.start_date)} — {fmtDate(activeTrip.end_date)}</span><span><Users size={15}/>{people.length} viajeros</span></div><div className="hero-bottom"><div className="avatar-stack">{people.slice(0,5).map((p,i)=><span key={p} className={`avatar av-${i%5}`}>{initials(p)}</span>)}</div><button className="text-button" onClick={()=>onNavigate('people')}>Ver participantes <ChevronRight size={15}/></button></div></div></div>
 <div className="stats-grid"><div className="stat-card"><div className="stat-icon mint"><Wallet size={19}/></div><span className="stat-label">Gasto total del grupo</span><strong>{money(totalSpent)}</strong><small><span className="stat-dot green-dot"/> {expenses.length} gastos registrados</small></div><div className="stat-card"><div className="stat-icon lavender"><Users size={19}/></div><span className="stat-label">Personas en el viaje</span><strong>{people.length}</strong><small>Compartiendo aventura</small></div><div className="stat-card"><div className="stat-icon peach"><CalendarDays size={19}/></div><span className="stat-label">Días de viaje</span><strong>{days??'—'}</strong><small>{activities.length} actividades planeadas</small></div><div className="stat-card"><div className="stat-icon blue"><Luggage size={19}/></div><span className="stat-label">Maleta preparada</span><strong>{completed}<small className="inline-total">/{packing.length}</small></strong><div className="progress-track"><span style={{width:`${packing.length?completed/packing.length*100:0}%`}}/></div></div></div>
 <div className="overview-grid"><div className="content-card expense-overview"><div className="card-heading"><div><span className="eyebrow">LAS CUENTAS CLARAS</span><h3>Últimos gastos</h3></div><button className="text-button" onClick={()=>onNavigate('expenses')}>Ver todos <ChevronRight size={15}/></button></div>{expenses.length?<div className="expense-list">{expenses.slice(0,4).map((e,i)=><div className="expense-row" key={e.id}><span className={`expense-icon expense-color-${i%4}`}>{e.category==='Transporte'?'🚕':e.category==='Estancia'?'🛏️':e.category==='Actividades'?'🎟️':e.category==='Comida'?'🍜':'🧾'}</span><div className="expense-description"><b>{e.description}</b><small>Pagado por {e.paid_by} · {fmtDate(e.expense_date||e.date)}</small></div><b className="expense-amount">{money(e.amount)}</b><button className="icon-button delete-small" title="Eliminar gasto" onClick={()=>onDelete(e)}><Trash2 size={14}/></button></div>)}</div>:<EmptyState icon={<Wallet size={22}/>} title="Aún no hay gastos" text="Añadid el primer gasto para empezar a repartir cuentas." action={()=>onModal('expense')} label="Añadir gasto"/>}</div>
 <div className="content-card balance-overview"><div className="card-heading"><div><span className="eyebrow">QUIÉN DEBE A QUIÉN</span><h3>Balance del grupo</h3></div><span className="balance-spark">✳</span></div><p className="card-subtext">Reparto equitativo de los gastos registrados.</p>{people.length?<div className="balance-list">{people.map((p,i)=><div className="balance-row" key={p}><span className={`avatar av-${i%5}`}>{initials(p)}</span><span className="balance-person">{p}</span><span className={`balance-amount ${(net[p]||0)>0.01?'positive':(net[p]||0)<-0.01?'negative':''}`}>{Math.abs(net[p]||0)<0.01?'Al día':(net[p]>0?'+':'−')+money(Math.abs(net[p]))}</span></div>)}</div>:<p className="muted">Añade participantes para ver el balance.</p>}<button className="settle-button" onClick={()=>onNavigate('expenses')}>Ver cómo saldar cuentas <ArrowUpRight size={16}/></button></div></div>
 <div className="bottom-grid"><div className="content-card"><div className="card-heading"><div><span className="eyebrow">QUE NO SE OS PASE NADA</span><h3>Próximos planes</h3></div><button className="text-button" onClick={()=>onNavigate('itinerary')}>Itinerario <ChevronRight size={15}/></button></div>{activities.length?<div className="mini-agenda">{activities.slice().sort((a,b)=>(Number(a.day)||1)-(Number(b.day)||1)||(a.time||'').localeCompare(b.time||'')).slice(0,3).map((a,i)=><div className="agenda-row" key={a.id}><div className="agenda-time"><b>{a.time||a.start_time||'—'}</b><small>DÍA {a.day||a.day_number}</small></div><div className="agenda-line"><span/></div><div className="agenda-copy"><b>{a.title}</b><small><MapPin size={12}/>{a.location||a.category}</small></div></div>)}</div>:<EmptyState icon={<CalendarDays size={22}/>} title="El plan está en blanco" text="Añade actividades para cada día del viaje." action={()=>onModal('activity')} label="Planear actividad"/>}</div>
 <div className="content-card packing-overview"><div className="card-heading"><div><span className="eyebrow">CHECKLIST DE VIAJE</span><h3>La maleta</h3></div><button className="text-button" onClick={()=>onNavigate('packing')}>Ver lista <ChevronRight size={15}/></button></div><div className="packing-progress-copy"><span>{completed} de {packing.length} cosas listas</span><b>{packing.length?Math.round(completed/packing.length*100):0}%</b></div><div className="progress-track big"><span style={{width:`${packing.length?completed/packing.length*100:0}%`}}/></div>{packing.slice(0,3).map(item=><div className="packing-mini" key={item.id}><span className={`fake-checkbox ${item.checked?'checked':''}`}>{item.checked&&<Check size={12}/>}</span><span className={item.checked?'done':''}>{item.name}</span></div>)}{!packing.length&&<p className="muted small-copy">Cread vuestra lista de imprescindibles.</p>}</div></div>
 </>;
}
function EmptyState({icon,title,text,action,label}){return <div className="empty-state"><span className="empty-state-icon">{icon}</span><b>{title}</b><p>{text}</p><button className="text-button" onClick={action}>{label} <Plus size={14}/></button></div>}
function ExpensesPage({expenses,people,totalSpent,net,transfers,onAdd,onDelete}){
 return <><SectionTitle eyebrow="GASTOS COMPARTIDOS" title="Las cuentas, claras." subtitle="Registrad los pagos y dejad que Rumbo haga los cálculos." action={onAdd} actionLabel="Añadir gasto"/><div className="expense-summary-grid"><div className="summary-tile"><span className="stat-icon mint"><CircleDollarSign size={19}/></span><small>Gasto acumulado</small><strong>{money(totalSpent)}</strong></div><div className="summary-tile"><span className="stat-icon lavender"><Wallet size={19}/></span><small>Gastos registrados</small><strong>{expenses.length}</strong></div><div className="summary-tile"><span className="stat-icon peach"><Users size={19}/></span><small>Coste medio por persona</small><strong>{money(people.length?totalSpent/people.length:0)}</strong></div></div>
 <div className="content-card page-card"><div className="card-heading"><div><span className="eyebrow">MOVIMIENTOS</span><h3>Historial de gastos</h3></div><span className="pill">{expenses.length} registros</span></div>{expenses.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Concepto</th><th>Pagado por</th><th>Fecha</th><th>Repartido entre</th><th className="align-right">Importe</th><th/></tr></thead><tbody>{expenses.map(e=><tr key={e.id}><td><span className="table-concept"><span className="table-emoji">{e.category==='Estancia'?'🛏️':e.category==='Transporte'?'🚕':e.category==='Actividades'?'🎟️':e.category==='Comida'?'🍜':'🧾'}</span><span><b>{e.description}</b><small>{e.category||'Otros'}</small></span></span></td><td>{e.paid_by}</td><td>{fmtDate(e.expense_date||e.date)}</td><td>{(e.split_names?.length?e.split_names:people).length} personas</td><td className="align-right amount-cell">{money(e.amount)}</td><td><button className="icon-button delete-small" onClick={()=>onDelete(e)} title="Eliminar"><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>:<EmptyState icon={<Wallet size={22}/>} title="Todavía no hay movimientos" text="Añade un gasto y el reparto se calculará automáticamente." action={onAdd} label="Añadir el primer gasto"/>}</div>
 <div className="content-card page-card"><div className="card-heading"><div><span className="eyebrow">CIERRE DE CUENTAS</span><h3>Balance individual</h3></div><span className="pill green-pill">Actualizado automáticamente</span></div><p className="card-subtext">Importes positivos: esa persona ha adelantado dinero. Negativos: le corresponde pagar.</p><div className="balance-detail-grid">{people.map((p,i)=><div className="balance-detail" key={p}><div className="person-line"><span className={`avatar av-${i%5}`}>{initials(p)}</span><b>{p}</b></div><strong className={(net[p]||0)>0.01?'positive':(net[p]||0)<-0.01?'negative':''}>{Math.abs(net[p]||0)<0.01?'Al día':(net[p]>0?'+':'−')+money(Math.abs(net[p]))}</strong><small>{(net[p]||0)>0.01?'Debe recibir':(net[p]||0)<-0.01?'Debe pagar':'Cuentas saldadas'}</small></div>)}</div>
 <div className="settlement-box"><div className="settlement-heading"><span className="settlement-icon"><ArrowUpRight size={18}/></span><div><b>Propuesta para saldar las cuentas</b><small>El menor número de transferencias posibles, calculado a partir de los gastos.</small></div></div>{transfers.length?transfers.map((t,i)=><div className="transfer-row" key={i}><span className="transfer-person">{t.from}</span><ArrowUpRight size={15}/><span className="transfer-person">{t.to}</span><strong>{money(t.amount)}</strong></div>):<div className="all-settled"><Check size={17}/> Todo está saldado. ¡A disfrutar del viaje!</div>}</div></div></>;
}
function PeoplePage({people,groups,onAdd,onGroup}){
 return <><SectionTitle eyebrow="VUESTRO EQUIPO" title="La aventura es mejor juntos." subtitle={`${people.length} participantes en este viaje.`} action={onAdd} actionLabel="Añadir persona"/><div className="people-layout"><div className="content-card page-card"><div className="card-heading"><div><span className="eyebrow">EL GRUPO</span><h3>Participantes</h3></div><span className="pill">{people.length} personas</span></div><div className="people-grid">{people.map((p,i)=><div className="person-card" key={p}><div className={`person-avatar av-${i%5}`}>{initials(p)}</div><b>{p}</b><small>{i===0?'En el viaje':'Participante'}</small><span className="person-status"><span/> En el grupo</span></div>)}</div>{!people.length&&<EmptyState icon={<Users size={22}/>} title="Falta la tripulación" text="Añade a tus compañeros de viaje." action={onAdd} label="Añadir persona"/>}</div><div className="content-card page-card"><div className="card-heading"><div><span className="eyebrow">PLANES PARA TODOS</span><h3>Grupos</h3></div><button className="icon-button" onClick={onGroup}><Plus size={17}/></button></div><p className="card-subtext">Organiza subgrupos para actividades, habitaciones o coches.</p>{groups.length?groups.map((g,i)=><div className="group-row" key={g.id}><span className={`group-icon group-${i%3}`}><Users size={18}/></span><div className="group-info"><b>{g.name}</b><small>{g.members.length} integrantes</small><div className="avatar-stack">{g.members.slice(0,5).map((m,j)=><span className={`avatar av-${j%5}`} key={m}>{initials(m)}</span>)}</div></div><ChevronRight size={16}/></div>):<EmptyState icon={<Users size={22}/>} title="¿Un plan dentro del plan?" text="Crea grupos para repartir habitaciones o montar actividades." action={onGroup} label="Crear grupo"/>}<button className="secondary-button full group-create" onClick={onGroup}><Plus size={16}/> Crear un grupo</button></div></div><div className="tip-banner"><Sparkles size={20}/><div><b>Un consejo para el grupo</b><p>Antes de salir, añadid a todas las personas que compartirán gastos. Así el reparto será mucho más preciso.</p></div></div></>;
}
function ItineraryPage({activities,trip,onAdd}){
 const days=[...new Set(activities.map(a=>String(a.day||a.day_number||1)))].sort((a,b)=>Number(a)-Number(b));
 const maxDay=trip.start_date&&trip.end_date?Math.max(1,Math.round((new Date(trip.end_date)-new Date(trip.start_date))/86400000)+1):Math.max(1,...days.map(Number));
 const allDays=Array.from({length:Math.min(maxDay,30)},(_,i)=>String(i+1));
 const ordered=activities.slice().sort((a,b)=>Number(a.day||a.day_number)-Number(b.day||b.day_number)||(a.time||a.start_time||'').localeCompare(b.time||b.start_time||''));
 return <><SectionTitle eyebrow="PLANIFICACIÓN DEL VIAJE" title="Cada día, una historia." subtitle="Organizad actividades, horarios y puntos de encuentro." action={onAdd} actionLabel="Añadir actividad"/><div className="itinerary-intro"><div className="itinerary-intro-icon"><Compass size={24}/></div><div><b>{trip.name}</b><span><MapPin size={14}/>{trip.destination||'Destino por decidir'} <span className="intro-separator">·</span> {fmtDate(trip.start_date)} — {fmtDate(trip.end_date)}</span></div><div className="itinerary-count"><b>{activities.length}</b><small>planes</small></div></div>
 <div className="itinerary-days">{allDays.map(d=>{const dayActs=ordered.filter(a=>String(a.day||a.day_number||1)===d);const date=trip.start_date?new Date(new Date(`${trip.start_date}T12:00:00`).getTime()+(Number(d)-1)*86400000):null;return <section className="day-section" key={d}><div className="day-heading"><div className="day-number">{String(d).padStart(2,'0')}</div><div><span className="eyebrow">DÍA {d}</span><h3>{date?date.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}):`Día ${d} del viaje`}</h3></div><span className="day-count">{dayActs.length} {dayActs.length===1?'actividad':'actividades'}</span></div>{dayActs.length?<div className="timeline">{dayActs.map((a,i)=><div className="timeline-item" key={a.id}><div className="timeline-time">{a.time||a.start_time||'—'}</div><div className="timeline-rail"><span className={`timeline-dot dot-${i%4}`}/></div><div className="activity-card"><div className="activity-card-top"><span className={`activity-category cat-${(a.category||'Visita').toLowerCase().replace('ó','o')}`}>{a.category||'Visita'}</span></div><h4>{a.title}</h4>{a.location&&<p><MapPin size={14}/>{a.location}</p>}</div></div>)}</div>:<button className="add-day-activity" onClick={onAdd}><Plus size={16}/> Añadir plan para este día</button>}</section>})}</div></>;
}
function PackingPage({items,onToggle,onAdd}){
 const categories=[...new Set(items.map(i=>i.category||'General'))];
 const done=items.filter(i=>i.checked).length;
 return <><SectionTitle eyebrow="PREPARAD EL EQUIPAJE" title="Que no se quede nada atrás." subtitle="Una lista compartida para llegar al destino con todo lo necesario." action={onAdd} actionLabel="Añadir objeto"/><div className="packing-hero"><div className="packing-hero-copy"><span className="eyebrow">LISTA DE EQUIPAJE</span><h2>¡Ya casi está todo!</h2><p>Marcad cada objeto cuando esté listo. Un pequeño check ahora, una preocupación menos después.</p><div className="packing-hero-stats"><b>{done}<small> / {items.length} objetos listos</small></b><span>{items.length?Math.round(done/items.length*100):0}% completado</span></div><div className="progress-track big"><span style={{width:`${items.length?done/items.length*100:0}%`}}/></div></div><div className="packing-illustration">🧳<span>✈️</span></div></div><div className="packing-layout"><div className="content-card page-card"><div className="card-heading"><div><span className="eyebrow">TODO LO QUE NECESITÁIS</span><h3>Lista de objetos</h3></div><span className="pill">{items.length-done} pendientes</span></div>{items.length?categories.map(cat=><div className="packing-category" key={cat}><div className="packing-category-title"><span>{cat==='General'?'📌':cat==='Ropa'?'👕':cat==='Electrónica'?'🔌':cat==='Imprescindible'?'🪪':'🎒'}</span><b>{cat}</b><small>{items.filter(i=>(i.category||'General')===cat&&i.checked).length}/{items.filter(i=>(i.category||'General')===cat).length}</small></div>{items.filter(i=>(i.category||'General')===cat).map(item=><label className={`packing-item ${item.checked?'packing-item-done':''}`} key={item.id}><input type="checkbox" checked={!!item.checked} onChange={()=>onToggle(item)}/><span className="custom-check">{item.checked&&<Check size={14}/>}</span><span className="packing-item-name">{item.name}</span>{item.checked&&<span className="ready-label">LISTO</span>}</label>)}</div>):<EmptyState icon={<Luggage size={22}/>} title="La maleta está vacía" text="Añade documentación, ropa y todo lo que necesitéis." action={onAdd} label="Añadir primer objeto"/>}</div><div className="packing-side"><div className="content-card packing-tip"><span className="tip-illustration">💡</span><span className="eyebrow">TIP DE VIAJE</span><h3>Lo importante, a mano.</h3><p>Documentación, medicación necesaria y cargadores: comprobad los imprescindibles antes de cerrar la maleta.</p></div><div className="content-card packing-check-summary"><h3>Tu progreso</h3><div className="summary-progress"><span>Preparado</span><b>{done}</b></div><div className="summary-progress"><span>Por preparar</span><b>{items.length-done}</b></div><div className="progress-track big"><span style={{width:`${items.length?done/items.length*100:0}%`}}/></div></div></div></div></>;
}
export default App;
