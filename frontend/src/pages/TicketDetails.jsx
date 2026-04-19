import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
    ArrowLeft, Train, MapPin, Calendar, Clock, Leaf, XCircle,
    RefreshCw, User, Users, Ticket as TicketIcon, CheckCircle2,
    AlertCircle, CreditCard
} from 'lucide-react';

/* ─── Status badge ─────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const cfg = {
        CONFIRMED: { text: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', dot: 'bg-green-400', icon: CheckCircle2 },
        BOOKED:    { text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400', icon: AlertCircle },
        CANCELLED: { text: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/30',   dot: 'bg-red-400',   icon: XCircle },
    };
    const c = cfg[status] || cfg.BOOKED;
    const Icon = c.icon;
    return (
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold tracking-wide ${c.bg} ${c.text}`}>
            <Icon className="h-4 w-4" />
            {status}
        </span>
    );
};

/* ─── KPI card ─────────────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, iconColor, label, value, sub }) => (
    <div className="glass-panel p-5 flex flex-col gap-2">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-current/10 ${iconColor}`}>
            <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">{label}</p>
        <p className="text-2xl font-extrabold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
);

/* ─── Main component ────────────────────────────────────────────── */
const TicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(false);
    const [error, setError] = useState('');

    const fetchTicket = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tickets/${id}`);
            setTicket(res.data);
        } catch (e) {
            setError('Could not load ticket details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { 
        fetchTicket(); 
        // Background ACK so it doesn't show in notification banner again
        api.post(`/tickets/acknowledge/${id}`).catch(() => {});
    }, [fetchTicket, id]);


    const handleCancel = async () => {
        if (!window.confirm('Cancel this ticket? An 80% refund will be initiated automatically.')) return;
        setCancelling(true);
        setCancelSuccess(false);
        try {
            const res = await api.post(`/tickets/cancel/${id}`);
            setTicket(res.data);
            setCancelSuccess(true);
        } catch (e) {
            alert(e.response?.data?.message || 'Cancellation failed. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse">
                <div className="glass-panel p-16">
                    <Train className="h-12 w-12 text-teal-500 mx-auto mb-4 animate-spin" style={{ animationDuration: '3s' }} />
                    <p className="text-gray-400 text-lg">Fetching ticket details…</p>
                </div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="glass-panel p-16">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 text-lg">{error || 'Ticket not found.'}</p>
                    <button onClick={() => navigate('/home')} className="btn-primary mt-6">Back to Home</button>
                </div>
            </div>
        );
    }

    const isCancelled = ticket.status === 'CANCELLED';

    let displaySource = ticket.sourceStation || '—';
    let displayDest = ticket.destinationStation || '—';
    if ((!ticket.sourceStation || ticket.sourceStation === '—') && ticket.routeName && ticket.routeName.includes(' - ')) {
        const parts = ticket.routeName.split(' - ');
        if (parts.length >= 2) {
            displaySource = parts[0].trim().toUpperCase();
            displayDest = parts[1].split(' ')[0].trim().toUpperCase();
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">

            {/* Back button */}
            <button
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors mb-8 group"
            >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Dashboard</span>
            </button>

            {/* Header */}
            <div className="glass-panel p-8 mb-6 relative overflow-hidden">
                {/* Decorative gradient blob */}
                <div className={`absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20 ${isCancelled ? 'bg-red-500' : 'bg-teal-500'}`} />

                <div className="flex flex-wrap items-start justify-between gap-6 relative z-10">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">PNR Number</p>
                        <p className="text-3xl font-mono font-extrabold text-white tracking-widest mb-3">{ticket.pnrNumber}</p>
                        <StatusBadge status={ticket.status} />
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Total Fare</p>
                        <p className="text-4xl font-extrabold text-teal-400">₹{ticket.totalFare?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">Booked: {ticket.bookingTime}</p>
                    </div>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <KpiCard icon={Train}    iconColor="text-teal-400"   label="Train"        value={ticket.trainNumber} sub={ticket.trainName} />
                <KpiCard icon={Calendar} iconColor="text-blue-400"   label="Journey Date" value={ticket.journeyDate} />
                <KpiCard icon={Clock}    iconColor="text-purple-400" label="Departure"    value={ticket.departureTime} sub={`Arrives ${ticket.arrivalTime}`} />
                <KpiCard icon={Leaf}     iconColor="text-green-400"  label="Carbon Points" value={`+${ticket.carbonPointsEarned ?? 0}`} sub="Eco Rewards" />
            </div>

            {/* Route info */}
            <div className="glass-panel p-6 mb-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Route Details
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex-1 text-center">
                        <p className="text-xs text-gray-500 mb-1">From</p>
                        <p className="text-xl font-bold text-white">{displaySource}</p>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0 px-4">
                        <div className="flex items-center gap-1 text-teal-500">
                            <div className="w-2 h-2 rounded-full bg-teal-500" />
                            <div className="w-16 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500" />
                            <Train className="h-5 w-5" />
                            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400" />
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 font-semibold">{ticket.routeName}</p>
                    </div>
                    <div className="flex-1 text-center">
                        <p className="text-xs text-gray-500 mb-1">To</p>
                        <p className="text-xl font-bold text-white">{displayDest}</p>
                    </div>
                </div>
            </div>

            {/* Passenger & Seat Allocations */}
            {ticket.seats && ticket.seats.length > 0 && (
                <div className="glass-panel p-6 mb-6">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Passengers & Seats
                    </h2>
                    <div className="space-y-3">
                        {ticket.seats.map((seat, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between bg-gray-900/60 rounded-xl px-5 py-4 border border-gray-800"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                                        <User className="h-4 w-4 text-teal-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{seat.passengerName}</p>
                                        <p className="text-xs text-gray-500">
                                            Age: {seat.passengerAge ?? '—'} &bull; {seat.passengerGender || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-teal-400">{seat.seatLabel}</p>
                                    <p className="text-xs text-gray-500">{seat.seatClass}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Refund banner (if cancelled) */}
            {isCancelled && ticket.refundAmount != null && (
                <div className={`glass-panel p-6 mb-6 border-2 ${ticket.refundStatus === 'PENDING' ? 'border-yellow-500/40' : 'border-blue-500/40'}`}>
                    {cancelSuccess && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm font-bold text-center">
                            Cancellation successful. Refund will be processed shortly.
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${ticket.refundStatus === 'PENDING' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                            <RefreshCw className={`h-6 w-6 ${ticket.refundStatus === 'PENDING' ? 'text-yellow-400 animate-spin' : 'text-blue-400'}`} />
                        </div>
                        <div>
                            <p className={`font-bold text-lg ${ticket.refundStatus === 'PENDING' ? 'text-yellow-400' : 'text-blue-400'}`}>
                                {ticket.refundStatus === 'PENDING' ? 'Refund Processing…' : 'Refund Completed ✓'}
                            </p>
                            <p className="text-gray-400 text-sm">
                                ₹{ticket.refundAmount?.toFixed(2)} (80% of fare)
                                {ticket.cancellationDate && ` · Cancelled ${ticket.cancellationDate}`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel button */}
            {!isCancelled && (
                <div className="glass-panel p-6 flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-white flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" /> Cancel & Refund
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            You will receive ₹{(ticket.totalFare * 0.8).toFixed(2)} (80% refund) back to your bank account.
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/40 text-red-400 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${cancelling ? 'animate-spin' : 'hidden'}`} />
                        {!cancelling && <XCircle className="h-4 w-4" />}
                        {cancelling ? 'Processing…' : 'Cancel Ticket'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TicketDetails;
