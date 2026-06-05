'use client';

import { useState } from 'react';
import { fmtUSD } from '@/lib/format';
import { useScenario } from './ScenarioProvider';
import { usePrivacy } from '@/components/PrivacyProvider';

interface Props { open: boolean; onClose: () => void; }

const GOLD_PRICE_USD = 143; // per gram, 24k assumed

export default function PositionDrawer({ open, onClose }: Props) {
  const { result, position, updatePosition, positionUpdatedAt } = useScenario();
  const { s } = usePrivacy();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state — initialised from current position
  const [cashUSD, setCashUSD] = useState(String(position.cashUSD));
  const [egxEGP, setEgxEGP] = useState('460000');
  const [goldGrams, setGoldGrams] = useState('46');
  const [secondHouseEGP, setSecondHouseEGP] = useState('1500000');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  const goldUSD = parseFloat(goldGrams || '0') * GOLD_PRICE_USD;

  const handleSave = async () => {
    setSaving(true);
    await updatePosition({
      cashUSD: parseFloat(cashUSD) || 0,
      egxEGP: parseFloat(egxEGP) || 0,
      goldGrams: parseFloat(goldGrams) || 0,
      secondHouseEGP: parseFloat(secondHouseEGP) || 0,
      notes,
    });
    setSaving(false);
    setEditing(false);
  };

  const rows = [
    { label: 'EGX stocks', value: s('EGP 460,000'), note: '20%/yr growth', tag: 'assumed' as const },
    { label: 'Gold (46g)', value: s('$6,578'), note: '8%/yr · 24k assumed', tag: 'assumed' as const },
    { label: '2nd house', value: s('EGP 1,500,000'), note: '12%/yr · net of mortgage', tag: 'assumed' as const },
    { label: '2nd house mortgage', value: s('EGP 906,000 remaining'), note: '27.4%/yr · payoff May 2030', tag: 'assumed' as const },
    { label: 'Residence mortgage', value: s('EGP 10,333/mo'), note: 'Until Apr 2030', tag: 'assumed' as const },
    { label: 'USD cash', value: s(`$${position.cashUSD.toLocaleString()}`), note: 'liquid', tag: 'measured' as const },
    { label: 'Net worth today', value: s(fmtUSD(result.netWorthT0)), note: 'from simulation', tag: 'measured' as const },
    { label: 'Monthly surplus', value: s(fmtUSD(result.surplusT0)), note: 'from simulation', tag: 'measured' as const },
  ];

  const inputStyle = {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '7px 11px', color: 'var(--text)',
    fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', width: '100%',
  };
  const labelStyle = { fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginBottom: 4, display: 'block' as const };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 480, background: 'var(--surface)',
        borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: 24,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="scenario-h2">Position</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {positionUpdatedAt && !editing && (
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginTop: -12 }}>
            Last updated {new Date(positionUpdatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}

        {/* Read view */}
        {!editing && (
          <>
            <div className="flex flex-col gap-3">
              {rows.map(r => (
                <div key={r.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)', fontWeight: 500 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.note}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="scenario-mono" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>{r.value}</span>
                    <span style={{
                      fontSize: 11, padding: '1px 6px', borderRadius: 'var(--radius-pill)',
                      background: r.tag === 'measured' ? 'rgba(111,185,140,0.15)' : 'rgba(235,181,77,0.12)',
                      color: r.tag === 'measured' ? 'var(--positive)' : 'var(--brand-dim)',
                    }}>
                      {r.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'rgba(235,181,77,0.1)', border: '1px solid rgba(235,181,77,0.3)',
                borderRadius: 10, padding: '10px 16px', color: 'var(--brand)',
                fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Update actuals
            </button>
          </>
        )}

        {/* Edit form */}
        {editing && (
          <div className="flex flex-col gap-4">
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
              Update your current holdings. Saves to Supabase — syncs across devices.
            </p>

            <div>
              <label style={labelStyle}>USD cash</label>
              <input type="number" value={cashUSD} onChange={e => setCashUSD(e.target.value)} style={inputStyle} placeholder="2000" />
            </div>

            <div>
              <label style={labelStyle}>EGX portfolio value (EGP)</label>
              <input type="number" value={egxEGP} onChange={e => setEgxEGP(e.target.value)} style={inputStyle} placeholder="460000" />
            </div>

            <div>
              <label style={labelStyle}>Gold (grams · 24k)</label>
              <input type="number" value={goldGrams} onChange={e => setGoldGrams(e.target.value)} style={inputStyle} placeholder="46" />
              {goldGrams && (
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                  ≈ {s(`$${Math.round(goldUSD).toLocaleString()}`)} at ${GOLD_PRICE_USD}/g
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>2nd house estimate (EGP, optional)</label>
              <input type="number" value={secondHouseEGP} onChange={e => setSecondHouseEGP(e.target.value)} style={inputStyle} placeholder="1500000" />
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} placeholder="e.g. EGX figure includes dividends" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1, background: 'var(--brand)', border: 'none',
                  borderRadius: 10, padding: '10px 16px', color: 'var(--bg)',
                  fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-body)',
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 16px', color: 'var(--text-2)',
                  fontSize: 'var(--fs-sm)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
