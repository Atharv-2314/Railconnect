import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Search, MapPin, TrainTrack, Ticket as TicketIcon, RefreshCw, XCircle, ChevronRight } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const cfg = {
        CONFIRMED: { text: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', dot: 'bg-green-400' },
        BOOKED:    { text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
        CANCELLED: { text: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/30',   dot: 'bg-red-400'   },
    };
    const c = cfg[status] || cfg.BOOKED;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] uppercase font-bold tracking-widest ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
            {status}
        </span>
    );
};

const HomePage = () => {
    const [routes, setRoutes] = useState([]);
    const navigate = useNavigate();
    
    // Smart Search states
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');

    // Booking states
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

    const [notifications, setNotifications] = useState([]);

    const fetchTickets = useCallback(async () => {
        try {
            setLoadingTickets(true);
            const res = await api.get('/tickets/my');
            setTickets(res.data || []);
            
            // Fetch unnotified auto-promoted waitlist tickets
            const notifRes = await api.get('/tickets/notifications');
            setNotifications(notifRes.data || []);
        } catch (err) {
            console.error("Failed fetching trips or notifications", err);
        } finally {
            setLoadingTickets(false);
        }
    }, []);

    const dismissNotification = async (ticketId) => {
        try {
            await api.post(`/tickets/acknowledge/${ticketId}`);
            setNotifications(prev => prev.filter(n => n.ticketId !== ticketId));
        } catch(e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchTickets();
        const fetchRoutes = async () => {
            try {
                const res = await api.get('/routes');
                setRoutes(res.data);
            } catch(e) {
                console.error("Failed fetching live routes");
            }
        };
        fetchRoutes();
    }, []);

    const handleSmartClick = (routeName) => {
        if (routeName.includes(' - ')) {
            const parts = routeName.split(' - ');
            if (parts.length >= 2) {
                const src = parts[0].trim();
                const destPart = parts[1].trim().split(' ')[0]; // E.g. "Mumbai Rajdhani Corridor" -> "Mumbai"
                setSource(src.toUpperCase());
                setDestination(destPart.toUpperCase());
                // Leave date empty to show all available dates
                setDate('');
            }
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/search?source=${source}&destination=${destination}&date=${date}`);
    };

    const handleCancel = async (ticketId) => {
        if (!window.confirm('Cancel this ticket? An 80% refund will be initiated.')) return;
        setCancellingId(ticketId);
        try {
            const token = localStorage.getItem('token');
            const res = await api.post(`/tickets/cancel/${ticketId}`, {}, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setTickets(prev => prev.map(t => t.ticketId === ticketId ? res.data : t));
            setCancelSuccessMsg("Cancellation successful. Refund will be processed shortly.");
            setTimeout(() => setCancelSuccessMsg(''), 5000);
        } catch (e) {
            alert(e.response?.data?.message || 'Cancellation failed. Try again.');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
            <h1 className="text-4xl font-extrabold text-white mb-8 flex items-center gap-3">
                <TrainTrack className="text-teal-400 h-10 w-10" />
                RailConnect Passenger Hub
            </h1>

            {notifications.length > 0 && (
                <div className="mb-8 space-y-4 animate-fade-in-up">
                    {notifications.map(notif => (
                        <div key={notif.ticketId} className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded-r-xl flex justify-between items-center shadow-lg shadow-green-500/5">
                            <div>
                                <h3 className="text-green-400 font-bold text-lg flex items-center gap-2">
                                    🎉 Waitlist Promoted: Ticket Confirmed!
                                </h3>
                                <p className="text-gray-300 text-sm mt-1">
                                    Your waitlisted journey on <span className="font-bold text-white">{notif.trainName}</span> is now confirmed. PNR: <span className="font-mono text-teal-300">{notif.pnrNumber}</span>
                                </p>
                            </div>
                            <button onClick={() => dismissNotification(notif.ticketId)} className="text-gray-400 hover:text-white transition-colors p-2">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* ─── LEFT PANEL: DISCOVERY & BOOKING ─── */}
                <div>

            {/* Smart Search Panel */}
            <div className="glass-panel p-8 mb-12 border-teal-500/20">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin className="h-5 w-5 text-teal-400" />
                            </div>
                            <input type="text" value={source} onChange={(e) => setSource(e.target.value.toUpperCase())} className="input-field pl-10" placeholder="Departure City" required />
                        </div>
                    </div>
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin className="h-5 w-5 text-blue-400" />
                            </div>
                            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} className="input-field pl-10" placeholder="Arrival City" required />
                        </div>
                    </div>
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Journey Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field [color-scheme:dark]" />
                    </div>
                    <button type="submit" className="btn-primary w-full md:w-auto px-8 py-3 h-[50px] flex items-center justify-center gap-2">
                        <Search className="h-5 w-5" />
                        <span>Search</span>
                    </button>
                </form>
            </div>

            {/* Top Routes Discovery */}
            <h2 className="text-2xl font-bold text-gray-300 mb-6">Popular Corridors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {routes.map(r => (
                    <div 
                        key={r.routeId} 
                        onClick={() => handleSmartClick(r.routeName)}
                        className="glass-panel p-6 cursor-pointer hover:bg-teal-500/10 hover:border-teal-500/50 transition-all group"
                    >
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">{r.routeName}</h3>
                        <p className="text-gray-400 text-sm">{r.totalDistance} KM Network Distance</p>
                        <div className="mt-4 text-xs font-bold text-teal-500 uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to Auto-fill <Search className="h-3 w-3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* ─── RIGHT PANEL: MY CURRENT BOOKINGS ─── */}
        <div>
            <h2 className="text-2xl font-bold text-gray-300 mb-6 flex items-center gap-2">
                <TicketIcon className="h-6 w-6 text-blue-400" /> My Current Bookings
            </h2>
            
            {cancelSuccessMsg && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm font-bold text-center">
                    {cancelSuccessMsg}
                </div>
            )}
            
            {loadingTickets ? (
                <div className="glass-panel p-8 text-center text-gray-400 animate-pulse">Loading journey history...</div>
            ) : tickets.length === 0 ? (
                <div className="glass-panel p-12 text-center text-gray-500 border-dashed border-2 border-gray-700">
                    No active bookings. Search a route to get started!
                </div>
            ) : (
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                    {tickets.map(t => (
                        <div
                            key={t.ticketId}
                            onClick={() => navigate(`/ticket/${t.ticketId}`)}
                            className={`glass-panel p-5 relative overflow-hidden transition-all cursor-pointer ${
                                t.status === 'CANCELLED'
                                    ? 'opacity-70 border-red-900/30'
                                    : 'hover:border-teal-500/40 hover:bg-gray-800/50 hover:shadow-lg hover:shadow-teal-500/5'
                            }`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">PNR: {t.pnrNumber}</p>
                                    <h3 className={`text-lg font-bold font-mono ${t.status === 'CANCELLED' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                        {t.trainName}
                                    </h3>
                                </div>
                                <StatusBadge status={t.status} />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-gray-900/50 p-3 rounded-lg">
                                <div>
                                    <p className="text-gray-500 text-xs">Route</p>
                                    <p className="text-gray-300 font-medium truncate" title={t.routeName}>{t.routeName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Journey</p>
                                    <p className="text-gray-300 font-mono">{t.journeyDate}</p>
                                </div>
                            </div>

                            {/* Footer row */}
                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-800">
                                <div className="flex-1">
                                    {t.status === 'CANCELLED' && t.refundAmount && (
                                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                                            t.refundStatus === 'PENDING' ? 'text-yellow-400' : 'text-blue-400'
                                        }`}>
                                            <RefreshCw className={`h-3.5 w-3.5 ${t.refundStatus === 'PENDING' && 'animate-spin'}`} />
                                            {t.refundStatus === 'PENDING' ? `Refund Pending: ₹${t.refundAmount}` : `Refunded ✓: ₹${t.refundAmount}`}
                                        </div>
                                    )}
                                    {t.status !== 'CANCELLED' && (
                                        <p className="text-xs text-gray-500">₹{t.totalFare} · {t.seats?.length || 0} Seat(s)</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {t.status === 'CONFIRMED' && (
                                        <button
                                            disabled={cancellingId === t.ticketId}
                                            onClick={(e) => { e.stopPropagation(); handleCancel(t.ticketId); }}
                                            className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 ${cancellingId === t.ticketId ? 'animate-spin' : 'hidden'}`} />
                                            {cancellingId !== t.ticketId && <XCircle className="h-3.5 w-3.5" />}
                                            {cancellingId === t.ticketId ? 'Processing…' : 'CANCEL'}
                                        </button>
                                    )}
                                    {t.status !== 'CANCELLED' && (
                                        <span className="text-[10px] font-bold text-teal-500/60 uppercase tracking-widest flex items-center gap-0.5">
                                            Details <ChevronRight className="h-3 w-3" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
