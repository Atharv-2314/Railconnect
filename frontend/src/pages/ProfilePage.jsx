import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
    UserCircle, Leaf, CreditCard, Ticket as TicketIcon,
    CheckCircle2, XCircle, CalendarDays, Phone, User,
    TrendingUp, ArrowLeft, Train
} from 'lucide-react';

/* ─── Sub-components ────────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, iconBg, iconColor, label, value, sub, accent }) => (
    <div className={`glass-panel p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
        <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${accent}`} />
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">{label}</p>
        <p className="text-3xl font-extrabold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-800/60 last:border-0">
        <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-semibold">{label}</p>
            <p className="text-white font-medium truncate">{value || '—'}</p>
        </div>
    </div>
);

/* ─── Donut chart (pure CSS) ─────────────────────────────────────── */
const DonutChart = ({ confirmed, cancelled, total }) => {
    const confirmedPct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    const cancelledPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;

    const confirmedDeg = (confirmedPct / 100) * 360;
    const cancelledDeg = (cancelledPct / 100) * 360;

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className="relative h-36 w-36 rounded-full"
                style={{
                    background: total === 0
                        ? '#374151'
                        : `conic-gradient(#34d399 0deg ${confirmedDeg}deg, #f87171 ${confirmedDeg}deg ${confirmedDeg + cancelledDeg}deg, #374151 ${confirmedDeg + cancelledDeg}deg 360deg)`,
                }}
            >
                <div className="absolute inset-4 rounded-full bg-gray-900 flex flex-col items-center justify-center">
                    <p className="text-xl font-extrabold text-white">{total}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">total</p>
                </div>
            </div>
            <div className="flex gap-6 text-xs">
                <span className="flex items-center gap-1.5 text-green-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> {confirmed} Confirmed
                </span>
                <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> {cancelled} Cancelled
                </span>
            </div>
        </div>
    );
};

/* ─── Carbon meter ───────────────────────────────────────────────── */
const CarbonMeter = ({ points }) => {
    const levels = [
        { label: 'Sprout',   min: 0,    color: 'bg-green-700',  icon: '🌱' },
        { label: 'Sapling',  min: 50,   color: 'bg-green-500',  icon: '🌿' },
        { label: 'Guardian', min: 150,  color: 'bg-teal-500',   icon: '🌳' },
        { label: 'Champion', min: 400,  color: 'bg-emerald-400',icon: '🏆' },
    ];
    const currentLevel = [...levels].reverse().find(l => points >= l.min) || levels[0];
    const nextLevel = levels[levels.indexOf(currentLevel) + 1];
    const progress = nextLevel
        ? Math.min(((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100, 100)
        : 100;

    return (
        <div className="glass-panel p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-400" /> Carbon Footprint
            </h3>
            <div className="flex items-center gap-5 mb-5">
                <div className="text-5xl">{currentLevel.icon}</div>
                <div>
                    <p className="text-2xl font-extrabold text-white">{points.toLocaleString()} pts</p>
                    <p className="text-green-400 font-bold text-sm">{currentLevel.label}</p>
                    {nextLevel && (
                        <p className="text-xs text-gray-500">{nextLevel.min - points} pts to {nextLevel.label}</p>
                    )}
                </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${currentLevel.color}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-1.5 font-bold">
                <span>{currentLevel.label} ({currentLevel.min})</span>
                {nextLevel && <span>{nextLevel.label} ({nextLevel.min})</span>}
            </div>
        </div>
    );
};

/* ─── Main ProfilePage ──────────────────────────────────────────── */
const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/user/profile');
                setProfile(res.data);
            } catch (e) {
                console.error('Failed to load profile', e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                <div className="glass-panel p-16 animate-pulse">
                    <UserCircle className="h-16 w-16 text-teal-500 mx-auto mb-4" />
                    <p className="text-gray-400">Loading profile…</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                <div className="glass-panel p-16">
                    <p className="text-red-400">Failed to load profile. Please try again.</p>
                    <button onClick={() => navigate('/home')} className="btn-primary mt-6">Back to Home</button>
                </div>
            </div>
        );
    }

    const cancelRate = profile.totalBookings > 0
        ? ((profile.cancelledBookings / profile.totalBookings) * 100).toFixed(0)
        : 0;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in-up">

            {/* Back button */}
            <button
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors mb-8 group"
            >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Dashboard</span>
            </button>

            {/* Hero identity card */}
            <div className="glass-panel p-8 mb-8 relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/30">
                        <span className="text-3xl font-extrabold text-white">
                            {(profile.fullName || profile.username || '?')[0].toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-extrabold text-white">{profile.fullName || profile.username}</h1>
                        <p className="text-teal-400 font-semibold">@{profile.username}</p>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5" /> Member since {profile.memberSince}
                        </p>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Travel Rank</p>
                        <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">
                            {profile.totalBookings >= 10 ? '🌟 Elite' : profile.totalBookings >= 5 ? '✈️ Explorer' : '🚂 Newcomer'}
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <KpiCard
                    icon={TicketIcon}
                    iconBg="bg-teal-500/20" iconColor="text-teal-400" accent="bg-teal-500"
                    label="Total Trips" value={profile.totalBookings} sub="All time"
                />
                <KpiCard
                    icon={CheckCircle2}
                    iconBg="bg-green-500/20" iconColor="text-green-400" accent="bg-green-500"
                    label="Confirmed" value={profile.confirmedBookings} sub="Successful journeys"
                />
                <KpiCard
                    icon={CreditCard}
                    iconBg="bg-blue-500/20" iconColor="text-blue-400" accent="bg-blue-500"
                    label="Total Spend" value={`₹${profile.totalSpent?.toFixed(0) ?? 0}`} sub="Lifetime"
                />
                <KpiCard
                    icon={XCircle}
                    iconBg="bg-red-500/20" iconColor="text-red-400" accent="bg-red-500"
                    label="Cancelled" value={profile.cancelledBookings} sub={`${cancelRate}% cancellation rate`}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Trip breakdown donut */}
                <div className="glass-panel p-6 flex flex-col items-center justify-center gap-2">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 self-start flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-400" /> Trip Breakdown
                    </h3>
                    <DonutChart
                        confirmed={profile.confirmedBookings}
                        cancelled={profile.cancelledBookings}
                        total={profile.totalBookings}
                    />
                </div>

                {/* Carbon meter */}
                <CarbonMeter points={profile.totalCarbonPoints || 0} />
            </div>

            {/* Personal info card */}
            <div className="glass-panel p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-400" /> Passenger Profile
                </h3>
                <div className="mt-2">
                    <InfoRow icon={User}         label="Full Name"   value={profile.fullName} />
                    <InfoRow icon={CalendarDays}  label="Age"         value={profile.age != null ? `${profile.age} years` : null} />
                    <InfoRow icon={Train}         label="Gender"      value={profile.gender} />
                    <InfoRow icon={Phone}         label="Phone"       value={profile.phone} />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
