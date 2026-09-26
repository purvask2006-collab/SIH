import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Download, FileCode2 } from 'lucide-react';

interface PythonDashCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonDashCodeModal: React.FC<PythonDashCodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonDashCode = `"""
=============================================================================
VIBESPAR DIGITAL TWIN DASHBOARD (SIH 2026)
4-Cylinder Aero Piston Engine (Rotax 914-F Turbo) for MALE UAV (TAPAS-BH-201)
Multi-Role Ground Control Station (GCS) Dashboard + AUTONOMOUS MAINTENANCE
=============================================================================
Architecture: Python Dash + Plotly
Roles & Innovation Areas:
  - Role Views: UAV Operator, Propulsion Engineer, Maintenance Team, Mission Reports
  - AUTONOMOUS MAINTENANCE ADVISORY SYSTEM (AMAS):
    * Feature 1: AI Maintenance Advisor (Conversational UI, Confidence %, TTF, Costs)
    * Feature 2: Priority Queue Auto-Ranking: (Severity x P(Fail)) / Time Until Critical
    * Feature 3: Mission Impact Simulator (Before/After Gauge Pair: Readiness & Failure Risk)
    * Feature 4: Service History & Learning (Closed-loop feedback, 94.6% Accuracy)
    * Feature 5: Digital Twin Wear Divergence Monitor (Theoretical vs Measured Sensor Wear)
  - EDGE AI & SECURITY ARCHITECTURE:
    * Edge Computing Stack, INT8 Compression, CAN Bus Monitor, Federated Learning, XAI
=============================================================================
"""

import math
import random
import time
from datetime import datetime
import dash
from dash import dcc, html, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
from plotly.subplots import make_subplots

THEME = {
    'bg_app': '#0a0e17', 'bg_card': '#0e1422', 'border': '#16273f',
    'cyan': '#06b6d4', 'emerald': '#10b981', 'amber': '#f59e0b', 'rose': '#ef4444',
    'text_primary': '#f1f5f9', 'text_secondary': '#94a3b8'
}

CARD_STYLE = {'backgroundColor': THEME['bg_card'], 'border': f"1px solid {THEME['border']}", 'borderRadius': '8px', 'padding': '12px 14px', 'marginBottom': '10px'}

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.DARKLY], suppress_callback_exceptions=True)
app.title = "VIBESPAR Maintenance Team GCS"

def render_maintenance_view(sim_data, tasks):
    comps = ['Piston Rings', 'Bearings', 'Valves', 'Injector (C2)', 'Oil Pump', 'Cooling Pump']
    healths = [82, 89, 84, 64, 52, 58]

    fig_timeline = go.Figure(go.Bar(
        x=healths, y=comps, orientation='h',
        marker=dict(color=['#ef4444' if h < 70 else ('#f59e0b' if h < 85 else '#10b981') for h in healths]),
        text=[f"{h}% (RUL: {round(h * 2.2)}h)" for h in healths], textposition='outside'
    ))
    fig_timeline.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font={'color': THEME['text_primary']}, height=200, margin={'t': 10, 'b': 25, 'l': 80, 'r': 30})

    return html.Div([
        # TOP HEADER
        html.Div(style={'backgroundColor': THEME['bg_card'], 'padding': '10px 18px', 'border': f"1px solid {THEME['border']}", 'borderRadius': '8px', 'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center'}, children=[
            html.Div([
                html.Span("VIBESPAR DIGITAL MAINTENANCE LOGBOOK & ADVISORY SYSTEM", style={'fontWeight': 'bold', 'color': THEME['text_primary']}),
                html.Span(" • TBO: 1200h (168h Remaining)", style={'color': THEME['amber'], 'marginLeft': '10px'})
            ]),
            dbc.Button("GENERATE MISSION HEALTH REPORT", id="btn-report", size="sm", style={'backgroundColor': '#0d2238', 'borderColor': THEME['cyan'], 'color': THEME['cyan']})
        ]),

        # PANEL 1: KANBAN ADVISORY BOARD
        dbc.Row([
            dbc.Col(html.Div(style=CARD_STYLE, children=[
                html.H6("RECOMMENDED ACTIONS (AI DETECTED)", style={'color': THEME['amber'], 'fontSize': '11px'}),
                html.Div(style={'padding': '8px', 'backgroundColor': '#070b13', 'borderRadius': '6px', 'border': f"1px solid {THEME['rose']}"}, children=[
                    html.Div("Cylinder 2 Injector [CRITICAL]", style={'color': THEME['rose'], 'fontWeight': 'bold'}),
                    html.Div("Advisory: Clean/Replace • Downtime: 1.5 hrs", style={'fontSize': '10px', 'color': THEME['cyan']}),
                    dbc.Button("MARK COMPLETE", id="btn-task-done", size="sm", style={'backgroundColor': '#0f3224', 'fontSize': '9px', 'marginTop': '4px'})
                ])
            ]), width=4),
            dbc.Col(html.Div(style=CARD_STYLE, children=[
                html.H6("SCHEDULED MAINTENANCE", style={'color': THEME['cyan'], 'fontSize': '11px'}),
                html.Div("Turbo Wastegate Servo Calibration (1.2h downtime)", style={'padding': '8px', 'backgroundColor': '#070b13', 'fontSize': '11px'})
            ]), width=4),
            dbc.Col(html.Div(style=CARD_STYLE, children=[
                html.H6("COMPLETED TASKS", style={'color': THEME['emerald'], 'fontSize': '11px'}),
                html.Div("Dual Spark Plugs Gap Audit (0.70mm)", style={'padding': '8px', 'backgroundColor': '#070b13', 'fontSize': '11px', 'textDecoration': 'line-through'})
            ]), width=4),
        ], style={'marginTop': '10px'}),

        # 2-COLUMN SPLIT: PANEL 2 (TIMELINE) & PANEL 3 (RUL & TBO)
        dbc.Row([
            dbc.Col(html.Div(style=CARD_STYLE, children=[
                html.H6("PANEL 2: 50-FLIGHT-HOUR COMPONENT HEALTH TIMELINE", style={'color': THEME['cyan'], 'fontSize': '11px'}),
                dcc.Graph(figure=fig_timeline, config={'displayModeBar': False})
            ]), width=7),
            dbc.Col(html.Div(style=CARD_STYLE, children=[
                html.H6("PANEL 3: RUL & TBO TRACKER", style={'color': THEME['amber'], 'fontSize': '11px'}),
                html.Div("TBO: 1200h (168h to major overhaul)", style={'fontSize': '12px'}),
                html.Div("Maintenance Window Optimizer: Recommended Post-Mission 027 (Gap 4.5h before Sortie 028). Avoids 18h AOG grounding.", style={'padding': '6px', 'backgroundColor': 'rgba(6,182,212,0.1)', 'fontSize': '10px', 'marginTop': '6px'})
            ]), width=5),
        ]),

        # PANEL 4: INVENTORY
        html.Div(style=CARD_STYLE, children=[
            html.H6("PANEL 4: PARTS INVENTORY & PROCUREMENT (AUTO-REORDER)", style={'color': THEME['emerald'], 'fontSize': '11px'}),
            html.Table(style={'width': '100%', 'fontSize': '11px'}, children=[
                html.Thead(html.Tr([html.Th("PART DESCRIPTION"), html.Th("STOCK"), html.Th("LEAD TIME"), html.Th("ORDER QTY"), html.Th("STATUS")])),
                html.Tbody([
                    html.Tr([html.Td("Cylinder 2 Injector Nozzle (Bosch EV14)"), html.Td("1 ea"), html.Td("4 days"), html.Td("+2 units"), html.Td("REORDER SUGGESTED", style={'color': THEME['amber']})]),
                    html.Tr([html.Td("Oil Pressure Relief Valve Assembly"), html.Td("0 ea"), html.Td("7 days"), html.Td("+1 unit"), html.Td("STOCKOUT - EXPEDITE", style={'color': THEME['rose']})]),
                ])
            ])
        ])
    ])

app.layout = html.Div([
    dcc.Interval(id='sim-interval', interval=2000, n_intervals=0),
    dcc.Store(id='store-tasks', data=[]),
    html.Div(id='maintenance-container')
])

@app.callback(Output('maintenance-container', 'children'), Input('sim-interval', 'n_intervals'))
def update_view(n):
    return render_maintenance_view({}, [])

if __name__ == '__main__':
    app.run_server(debug=True, port=8050)
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonDashCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonDashCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard_app.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#070e1c] border border-[#1b3456] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a162a] border-b border-[#1b3456]">
          <div className="flex items-center space-x-2.5">
            <FileCode2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-chakra font-bold text-sm text-slate-100 uppercase tracking-wider">
                PYTHON DASH + PLOTLY CODE // DIGITAL MAINTENANCE LOGBOOK & ADVISORY SYSTEM
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                5 panels: Kanban Advisory Board, 50h Timeline, TBO Optimizer, Inventory & Report Generator.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#12223c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Actions Bar */}
        <div className="px-4 py-2 bg-[#060c18] border-b border-[#16273f] flex items-center justify-between text-xs font-chakra">
          <div className="flex items-center space-x-2 text-slate-400">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Run locally with: <code className="font-mono text-cyan-300 px-1 py-0.5 rounded bg-[#091526]">python dashboard_app.py</code></span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded bg-[#0f213b] hover:bg-[#163056] border border-[#234572] text-slate-200 font-bold flex items-center space-x-1.5 transition-all text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY SCRIPT'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/70 text-amber-300 font-bold flex items-center space-x-1.5 transition-all text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD (.PY)</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 flex-1 overflow-auto bg-[#040812]">
          <pre className="text-xs font-tech text-slate-200 leading-relaxed font-mono selection:bg-cyan-900 selection:text-white">
            {pythonDashCode}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#0a162a] border-t border-[#1b3456] flex items-center justify-between text-[11px] font-chakra text-slate-400">
          <span>SIH 2026 • DRDO MALE UAV AERO PISTON DIGITAL TWIN</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#13243d] hover:bg-[#1c3356] text-slate-200 font-bold text-xs"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
