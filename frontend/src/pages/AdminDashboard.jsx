import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Train, Map, CalendarPlus, ShieldPlus,
    BarChart3, Users, IndianRupee, Leaf, Ticket, TrendingUp,
    AlertCircle, RefreshCw, ChevronDown, ChevronUp, Landmark, Clock,
    MapPin, Navigation
} from 'lucide-react';

// ─── Shared KPI Card ────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, color = 'teal' }) => {
    const colors = {
        teal:   { bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   icon: 'text-teal-400',   val: 'text-teal-400' },
        green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: 'text-green-400',  val: 'text-green-400' },
        blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400',   val: 'text-blue-400' },
        yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: 'text-yellow-400', val: 'text-yellow-300' },
        red:    { bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: 'text-red-400',    val: 'text-red-400' },
    };
    const c = colors[color];
    return (
        <div className={`glass-panel p-5 flex items-center gap-4 ${c.border}`}>
            <div className={`h-12 w-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-6 w-6 ${c.icon}`} />
            </div>
            <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
                {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
};

// ─── Occupancy Bar ──────────────────────────────────────────────────────────
const OccupancyBar = ({ pct }) => {
    const color = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
            <span className={`text-xs font-mono font-bold w-10 text-right ${
                pct >= 90 ? 'text-red-400' : pct >= 60 ? 'text-yellow-400' : 'text-green-400'
            }`}>{pct.toFixed(1)}%</span>
        </div>
    );
};

// ─── Analytics Tab ──────────────────────────────────────────────────────────
const AnalyticsTab = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedUser, setExpandedUser] = useState(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/analytics');
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load analytics. Ensure DB views are installed.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 animate-pulse">Querying analytics views...</p>
        </div>
    );

    if (error) return (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-4 py-4 rounded-xl text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={fetchAnalytics} className="ml-auto text-sm hover:underline flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
        </div>
    );

    if (!data) return null;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard icon={Ticket}       label="Total Bookings"  value={data.totalBookings}      color="teal" />
                <KpiCard icon={TrendingUp}   label="Confirmed"       value={data.confirmedBookings}  color="green" />
                <KpiCard icon={AlertCircle}  label="Cancelled"       value={data.cancelledBookings}  color="red" />
                <KpiCard icon={IndianRupee}  label="Total Revenue"   value={`₹${Number(data.totalRevenue).toLocaleString('en-IN', {maximumFractionDigits:0})}`} sub="confirmed tickets" color="yellow" />
                <KpiCard icon={Users}        label="Active Users"    value={data.totalUsers}         color="blue" />
                <KpiCard icon={Leaf}         label="Carbon Points"   value={data.totalCarbonPoints}  sub="CO₂ saved collectively" color="green" />
            </div>

            {/* Schedule Occupancy */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-teal-400" /> Schedule Occupancy
                </h3>
                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-left">
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-widest">Train</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-widest">Route</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-widest">Date</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-widest">Occupancy</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-widest text-center">Booked</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-widest text-center">Avail</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-widest text-center">WL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.scheduleOccupancies.map((s, i) => (
                                    <tr key={s.scheduleId} className={`border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-900/20'}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-white">{s.trainName}</div>
                                            <div className="text-xs text-gray-500 font-mono">{s.trainNumber}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 max-w-[160px] truncate">{s.routeName}</td>
                                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">{s.journeyDate}</td>
                                        <td className="px-4 py-3 w-40"><OccupancyBar pct={s.occupancyPct} /></td>
                                        <td className="px-4 py-3 text-center font-bold text-white">{s.bookedSeats}</td>
                                        <td className="px-4 py-3 text-center text-green-400 font-semibold">{s.availableSeats}</td>
                                        <td className="px-4 py-3 text-center">
                                            {s.waitlisted > 0
                                                ? <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold">{s.waitlisted}</span>
                                                : <span className="text-gray-600">–</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Passenger Summary */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" /> Passenger Discovery Hub
                </h3>
                <div className="space-y-2">
                    {data.userSummaries.map(u => (
                        <div key={u.userId} className="glass-panel overflow-hidden">
                            <button
                                onClick={() => setExpandedUser(expandedUser === u.userId ? null : u.userId)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/30 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{u.username}</p>
                                        <p className="text-xs text-gray-500">{u.totalBookings} booking{u.totalBookings !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="hidden md:flex items-center gap-6 text-sm">
                                        <span className="text-green-400 font-semibold">{u.confirmed} ✓</span>
                                        <span className="text-red-400">{u.cancelled} ✗</span>
                                        <span className="text-yellow-300 font-bold">₹{Number(u.totalSpent).toLocaleString('en-IN', {maximumFractionDigits:0})}</span>
                                        <span className="text-green-300 flex items-center gap-1"><Leaf className="h-3 w-3" />{u.carbonPoints}</span>
                                    </div>
                                    {expandedUser === u.userId ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                                </div>
                            </button>

                            {expandedUser === u.userId && (
                                <div className="border-t border-gray-800 px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900/30">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Total Bookings</p>
                                        <p className="text-xl font-bold text-white">{u.totalBookings}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Confirmed</p>
                                        <p className="text-xl font-bold text-green-400">{u.confirmed}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Cancelled</p>
                                        <p className="text-xl font-bold text-red-400">{u.cancelled}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Carbon Points</p>
                                        <p className="text-xl font-bold text-green-300">{u.carbonPoints}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-4 text-center border-t border-gray-800 pt-3 mt-1">
                                        <p className="text-xs text-gray-500 mb-1">Total Revenue Generated</p>
                                        <p className="text-2xl font-bold text-yellow-300">₹{Number(u.totalSpent).toLocaleString('en-IN', {minimumFractionDigits:2})}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Bank & Refunds Tab ───────────────────────────────────────────────────
const BankTab = () => {
    const [data, setData] = useState(null);
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retryingId, setRetryingId] = useState(null);

    const fetchBankData = useCallback(async () => {
        try {
            const [bankRes, refundRes] = await Promise.all([
                api.get('/admin/bank'),
                api.get('/admin/refunds/pending')
            ]);
            setData(bankRes.data);
            setRefunds(refundRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBankData(); }, [fetchBankData]);

    const handleRetry = async (id) => {
        setRetryingId(id);
        try {
            const res = await api.post(`/admin/refunds/retry/${id}`);
            alert(res.data.message);
            fetchBankData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to retry refund.');
        } finally {
            setRetryingId(null);
        }
    };

    if (loading) return <div className="text-gray-400 p-8 text-center animate-pulse">Accessing Central Bank...</div>;
    if (!data) return null;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Massive Hero Balance */}
            <div className="glass-panel p-8 text-center bg-gradient-to-b from-teal-900/40 to-transparent border-teal-500/30">
                <Landmark className="h-16 w-16 text-teal-400 mx-auto mb-4 opacity-80" />
                <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Central Bank Float Balance</p>
                <h2 className="text-6xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                    <span className="text-teal-500">₹</span>
                    {Number(data.currentBalance).toLocaleString('en-IN', {maximumFractionDigits:2})}
                </h2>
                <div className="mt-6 flex items-center justify-center gap-8 text-sm">
                    <div className="text-green-400"><span className="text-gray-500">Total Earnings:</span> ₹{Number(data.totalEarnings).toLocaleString('en-IN')}</div>
                    <div className="text-yellow-400"><span className="text-gray-500">Total Refunded:</span> ₹{Number(data.totalRefunds).toLocaleString('en-IN')}</div>
                </div>
            </div>

            {/* Pending Refunds Table */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-400" /> Pending Refunds Queue ({data.pendingRefundsCount})
                </h3>
                {refunds.length === 0 ? (
                    <div className="glass-panel p-8 text-center text-gray-500">No pending refunds. Settlement queue is clear.</div>
                ) : (
                    <div className="glass-panel overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="border-b border-gray-800 bg-gray-900/40">
                                <tr>
                                    <th className="px-4 py-3 text-gray-400">PNR</th>
                                    <th className="px-4 py-3 text-gray-400">User</th>
                                    <th className="px-4 py-3 text-gray-400">Amount</th>
                                    <th className="px-4 py-3 text-gray-400">Date Cancelled</th>
                                    <th className="px-4 py-3 text-right text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refunds.map(r => (
                                    <tr key={r.cancellationId} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-teal-400 font-bold">{r.pnrNumber}</td>
                                        <td className="px-4 py-3 text-white">{r.username}</td>
                                        <td className="px-4 py-3 text-yellow-400 font-semibold">₹{r.refundAmount?.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{r.cancellationDate}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => handleRetry(r.cancellationId)}
                                                disabled={retryingId === r.cancellationId}
                                                className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                            >
                                                {retryingId === r.cancellationId ? 'Retrying...' : 'Force Retry'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Admin Dashboard ───────────────────────────────────────────────────
const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('ANALYTICS');
    const [status, setStatus] = useState({ message: '', error: '' });

    const [trainForm, setTrainForm] = useState({ trainNumber: '', trainName: '', trainType: 'Express', totalCoaches: 3, status: 'ACTIVE' });
    const [routeForm, setRouteForm] = useState({ routeName: '', totalDistance: '' });
    const [scheduleForm, setScheduleForm] = useState({ trainId: '', routeId: '', journeyDate: '', departureTime: '', arrivalTime: '' });
    const [adminForm, setAdminForm] = useState({ username: '', password: '' });
    const [stationForm, setStationForm] = useState({ stationCode: '', stationName: '', city: '', state: '' });
    const [routeMapForm, setRouteMapForm] = useState({ routeId: '', station1Id: '', station2Id: '' });
    const [stations, setStations] = useState([]);
    const [waitlistSchedules, setWaitlistSchedules] = useState([]);
    const [waitlistEntries, setWaitlistEntries] = useState([]);
    const [selectedWlSchedule, setSelectedWlSchedule] = useState(null);

    const notify = (msg, err = '') => {
        setStatus({ message: msg, error: err });
        setTimeout(() => setStatus({ message: '', error: '' }), 4000);
    };

    const handleCreateTrain = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/trains', trainForm);
            notify(`Train ${res.data.trainNumber} deployed successfully!`);
            setTrainForm({ trainNumber: '', trainName: '', trainType: 'Express', totalCoaches: 10, status: 'ACTIVE' });
        } catch (err) { notify('', 'Failed to create train. Number might already exist.'); }
    };

    const handleCreateRoute = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/routes', routeForm);
            notify(`Route ID ${res.data.routeId} initialized!`);
            setRouteForm({ routeName: '', totalDistance: '' });
        } catch (err) { notify('', 'Failed to construct route.'); }
    };

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/schedules', scheduleForm);
            notify(`Schedule ID ${res.data.scheduleId} is live! Seats auto-generated.`);
            setScheduleForm({ trainId: '', routeId: '', journeyDate: '', departureTime: '', arrivalTime: '' });
        } catch (err) { notify('', 'Failed to create schedule. Verify Train/Route IDs.'); }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/create-admin', adminForm);
            notify(`Admin ${adminForm.username} authorized.`);
            setAdminForm({ username: '', password: '' });
        } catch (err) { notify('', 'Failed to authorize administrator.'); }
    };

    const handleCreateStation = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/stations', stationForm);
            notify(`Station ${res.data.stationName} (${res.data.stationCode}) created! ID: ${res.data.stationId}`);
            setStationForm({ stationCode: '', stationName: '', city: '', state: '' });
            loadStations();
        } catch (err) { notify('', 'Failed to create station. Code may already exist.'); }
    };

    const handleMapStations = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/routes/map-stations', {
                routeId: parseInt(routeMapForm.routeId),
                station1Id: parseInt(routeMapForm.station1Id),
                station2Id: parseInt(routeMapForm.station2Id),
            });
            notify(res.data.message);
            setRouteMapForm({ routeId: '', station1Id: '', station2Id: '' });
        } catch (err) { notify('', 'Failed to map stations. Check IDs are correct.'); }
    };

    const loadStations = async () => {
        try { const r = await api.get('/admin/stations'); setStations(r.data); } catch (_) {}
    };

    const loadWaitlistSchedules = async () => {
        try { const r = await api.get('/admin/waitlist'); setWaitlistSchedules(r.data); } catch (_) {}
    };

    const loadWaitlistEntries = async (scheduleId) => {
        setSelectedWlSchedule(scheduleId);
        try { const r = await api.get(`/admin/waitlist/${scheduleId}`); setWaitlistEntries(r.data); } catch (_) {}
    };

    const tabs = [
        { id: 'ANALYTICS', label: 'Analytics',  icon: BarChart3,     color: 'teal'   },
        { id: 'BANK',      label: 'Bank',        icon: Landmark,      color: 'teal'   },
        { id: 'TRAINS',    label: 'Trains',      icon: Train,         color: 'blue'   },
        { id: 'ROUTES',    label: 'Routes',      icon: Map,           color: 'indigo' },
        { id: 'STATIONS',  label: 'Stations',    icon: MapPin,        color: 'purple' },
        { id: 'ROUTEMAP',  label: 'Map Route',   icon: Navigation,    color: 'cyan'   },
        { id: 'SCHEDULES', label: 'Schedules',   icon: CalendarPlus,  color: 'yellow' },
        { id: 'WAITLIST',  label: 'Waitlist',    icon: Clock,         color: 'orange' },
        { id: 'ADMINS',    label: 'Admins',      icon: ShieldPlus,    color: 'red'    },
    ];

    const activeColors = {
        teal:   'bg-teal-500 text-white',
        blue:   'bg-blue-500 text-white',
        indigo: 'bg-indigo-500 text-white',
        yellow: 'bg-yellow-500 text-gray-900',
        red:    'bg-red-500 text-white',
        purple: 'bg-purple-500 text-white',
        cyan:   'bg-cyan-500 text-gray-900',
        orange: 'bg-orange-500 text-white',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <LayoutDashboard className="h-8 w-8 text-teal-400" /> Admin Command Center
                </h1>
                <p className="text-gray-400">Logged in as <span className="text-teal-400 font-semibold">{user?.username}</span></p>
            </div>

            {/* Horizontal Tab Bar */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                            activeTab === t.id
                                ? activeColors[t.color]
                                : 'glass-panel text-gray-400 hover:text-white'
                        }`}
                    >
                        <t.icon className="h-4 w-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* Status banners */}
            {status.message && <div className="bg-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-6 border border-green-500/30">{status.message}</div>}
            {status.error   && <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 border border-red-500/30">{status.error}</div>}

            {/* Analytics */}
            {activeTab === 'ANALYTICS' && <AnalyticsTab />}

            {/* Bank Tab */}
            {activeTab === 'BANK' && <BankTab />}

            {/* Train Manager */}
            {activeTab === 'TRAINS' && (
                <div className="glass-panel p-8 max-w-lg">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Train className="text-blue-400 h-5 w-5" /> Deploy Rolling Stock</h2>
                    <form className="space-y-4" onSubmit={handleCreateTrain}>
                        <input required placeholder="Train Number (e.g. 12951)" className="input-field" value={trainForm.trainNumber} onChange={e => setTrainForm({...trainForm, trainNumber: e.target.value})} />
                        <input required placeholder="Train Name" className="input-field" value={trainForm.trainName} onChange={e => setTrainForm({...trainForm, trainName: e.target.value})} />
                        <div className="flex gap-4">
                            <select className="input-field flex-1" value={trainForm.trainType} onChange={e => setTrainForm({...trainForm, trainType: e.target.value})}>
                                <option>Rajdhani</option><option>Shatabdi</option><option>Superfast</option><option>Express</option>
                            </select>
                            <input required type="number" placeholder="Coaches" className="input-field flex-1" value={trainForm.totalCoaches} onChange={e => setTrainForm({...trainForm, totalCoaches: parseInt(e.target.value)})} />
                        </div>
                        <button className="btn-primary w-full bg-blue-500 hover:bg-blue-400 shadow-blue-500/30">Deploy Train</button>
                    </form>
                </div>
            )}

            {/* Route Builder */}
            {activeTab === 'ROUTES' && (
                <div className="glass-panel p-8 max-w-lg">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Map className="text-indigo-400 h-5 w-5" /> Initialize Route</h2>
                    <form className="space-y-4" onSubmit={handleCreateRoute}>
                        <input required placeholder="Route Name (e.g. Delhi - Mumbai Corridor)" className="input-field" value={routeForm.routeName} onChange={e => setRouteForm({...routeForm, routeName: e.target.value})} />
                        <input required type="number" placeholder="Total Distance (km)" className="input-field" value={routeForm.totalDistance} onChange={e => setRouteForm({...routeForm, totalDistance: e.target.value})} />
                        <p className="text-xs text-gray-500">After creating, go to <strong className="text-cyan-400">Map Route</strong> tab to link stations.</p>
                        <button className="btn-primary w-full bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/30">Create Route</button>
                    </form>
                </div>
            )}

            {/* Station Creator */}
            {activeTab === 'STATIONS' && (
                <div className="glass-panel p-8 max-w-lg">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><MapPin className="text-purple-400 h-5 w-5" /> Create Station</h2>
                    <form className="space-y-4" onSubmit={handleCreateStation}>
                        <div className="flex gap-4">
                            <input required placeholder="Station Code (e.g. MAS)" className="input-field flex-1" value={stationForm.stationCode} onChange={e => setStationForm({...stationForm, stationCode: e.target.value.toUpperCase()})} />
                            <input required placeholder="Station Name" className="input-field flex-1" value={stationForm.stationName} onChange={e => setStationForm({...stationForm, stationName: e.target.value})} />
                        </div>
                        <div className="flex gap-4">
                            <input required placeholder="City" className="input-field flex-1" value={stationForm.city} onChange={e => setStationForm({...stationForm, city: e.target.value})} />
                            <input required placeholder="State" className="input-field flex-1" value={stationForm.state} onChange={e => setStationForm({...stationForm, state: e.target.value})} />
                        </div>
                        <button className="btn-primary w-full bg-purple-500 hover:bg-purple-400 shadow-purple-500/30">Create Station</button>
                    </form>
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Existing Stations</p>
                            <button onClick={loadStations} className="text-teal-400 text-xs hover:underline">Refresh</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {stations.map(s => (
                                <div key={s.stationId} className="flex justify-between bg-gray-900/60 rounded-lg px-4 py-2 text-sm">
                                    <span className="text-teal-400 font-mono font-bold">{s.stationId}</span>
                                    <span className="text-white">{s.stationName}</span>
                                    <span className="text-gray-500">{s.stationCode} · {s.city}</span>
                                </div>
                            ))}
                            {stations.length === 0 && <p className="text-gray-600 text-xs text-center py-2">Click Refresh to load stations</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Route Station Mapper */}
            {activeTab === 'ROUTEMAP' && (
                <div className="glass-panel p-8 max-w-lg">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Navigation className="text-cyan-400 h-5 w-5" /> Map Stations to Route</h2>
                    <p className="text-xs text-gray-500 mb-6">Link a source and destination station to an existing route. Check Station IDs in the Stations tab.</p>
                    <form className="space-y-4" onSubmit={handleMapStations}>
                        <input required type="number" placeholder="Route ID" className="input-field" value={routeMapForm.routeId} onChange={e => setRouteMapForm({...routeMapForm, routeId: e.target.value})} />
                        <div className="flex gap-4">
                            <input required type="number" placeholder="Station 1 ID (Source)" className="input-field flex-1" value={routeMapForm.station1Id} onChange={e => setRouteMapForm({...routeMapForm, station1Id: e.target.value})} />
                            <input required type="number" placeholder="Station 2 ID (Destination)" className="input-field flex-1" value={routeMapForm.station2Id} onChange={e => setRouteMapForm({...routeMapForm, station2Id: e.target.value})} />
                        </div>
                        <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-lg text-xs text-cyan-400">
                            After mapping, the search engine will find trains on this route when passengers search those cities.
                        </div>
                        <button className="btn-primary w-full bg-cyan-500 hover:bg-cyan-400 text-gray-900 shadow-cyan-500/30">Map Stations to Route</button>
                    </form>
                </div>
            )}

            {/* Schedule Creator */}
            {activeTab === 'SCHEDULES' && (
                <div className="glass-panel p-8 max-w-lg">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><CalendarPlus className="text-yellow-400 h-5 w-5" /> Generate Schedule</h2>
                    <form className="space-y-4" onSubmit={handleCreateSchedule}>
                        <div className="flex gap-4">
                            <input required type="number" placeholder="Train ID" className="input-field flex-1" value={scheduleForm.trainId} onChange={e => setScheduleForm({...scheduleForm, trainId: e.target.value})} />
                            <input required type="number" placeholder="Route ID" className="input-field flex-1" value={scheduleForm.routeId} onChange={e => setScheduleForm({...scheduleForm, routeId: e.target.value})} />
                        </div>
                        <input required type="date" className="input-field [color-scheme:dark]" value={scheduleForm.journeyDate} onChange={e => setScheduleForm({...scheduleForm, journeyDate: e.target.value})} />
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1">Departure Time</p>
                                <input required type="time" className="input-field [color-scheme:dark]" value={scheduleForm.departureTime} onChange={e => setScheduleForm({...scheduleForm, departureTime: e.target.value})} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1">Arrival Time</p>
                                <input required type="time" className="input-field [color-scheme:dark]" value={scheduleForm.arrivalTime} onChange={e => setScheduleForm({...scheduleForm, arrivalTime: e.target.value})} />
                            </div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg text-xs text-yellow-400">
                            Seat inventory will be auto-generated for all coaches on submit.
                        </div>
                        <button className="btn-primary w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 shadow-yellow-500/30">Generate Schedule & Inject Seats</button>
                    </form>
                </div>
            )}

            {/* Waitlist Viewer */}
            {activeTab === 'WAITLIST' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Clock className="text-orange-400 h-5 w-5" /> Active Waitlists</h2>
                        <button onClick={loadWaitlistSchedules} className="text-sm text-teal-400 hover:underline flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
                    </div>
                    {waitlistSchedules.length === 0 ? (
                        <div className="glass-panel p-12 text-center text-gray-500">No active waitlists. Click Refresh to check.</div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {waitlistSchedules.map(s => (
                                <button
                                    key={s.scheduleId}
                                    onClick={() => loadWaitlistEntries(s.scheduleId)}
                                    className={`glass-panel p-5 text-left transition-all hover:border-orange-500/40 ${selectedWlSchedule === s.scheduleId ? 'border-orange-500/60' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-white">{s.trainName}</p>
                                            <p className="text-xs text-gray-500 font-mono">{s.trainNumber} · {s.routeName}</p>
                                            <p className="text-xs text-gray-500 mt-1">{String(s.journeyDate)}</p>
                                        </div>
                                        <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full">{s.waitlistCount} waiting</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    {waitlistEntries.length > 0 && (
                        <div className="glass-panel overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-800">
                                <h3 className="font-semibold text-white">Waitlist Queue — Schedule #{selectedWlSchedule}</h3>
                            </div>
                            <table className="w-full text-sm">
                                <thead><tr className="border-b border-gray-800 text-left">
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase">Passenger</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase">Age</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase">Gender</th>
                                    <th className="px-4 py-3 text-xs text-gray-500 uppercase">Joined At</th>
                                </tr></thead>
                                <tbody>
                                    {waitlistEntries.map(w => (
                                        <tr key={w.waitlistId} className="border-b border-gray-800/60 hover:bg-gray-800/20">
                                            <td className="px-4 py-3 font-bold text-orange-400">#{w.position}</td>
                                            <td className="px-4 py-3 text-white font-medium">{w.passengerName}</td>
                                            <td className="px-4 py-3 text-gray-400">{w.passengerAge ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-400">{w.passengerGender || '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{w.joinedAt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Admin Management */}
            {activeTab === 'ADMINS' && (
                <div className="glass-panel p-8 max-w-lg">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ShieldPlus className="text-red-400 h-5 w-5" /> Authorize Admin</h2>
                    <form className="space-y-4" onSubmit={handleCreateAdmin}>
                        <input required placeholder="Admin Username (email)" className="input-field" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} />
                        <input required type="password" placeholder="Passkey" className="input-field" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
                        <button className="btn-primary w-full bg-red-500 hover:bg-red-400 shadow-red-500/30">Authorize New Admin</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
