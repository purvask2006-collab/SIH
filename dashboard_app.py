"""
=============================================================================
VIBESPAR DIGITAL TWIN DASHBOARD (SIH 2026)
4-Cylinder Aero Piston Engine (Rotax 914-F Turbo) for MALE UAV (TAPAS-BH-201)
Multi-Role Ground Control Station (GCS) Dashboard + MISSION REPORTS MODULE
=============================================================================
Architecture: Python Dash + Plotly
Features:
  - Role Views: UAV Operator, Propulsion Engineer, Maintenance Team
  - Top-Level MISSION-WISE HEALTH REPORTS MODULE (Shared Across All Roles)
    * Report Dashboard: Past missions table (Sortie 020 to 027) with filters & metrics
    * Individual Mission Report:
      1. Executive Summary & Sortie Synopsis (Letter Grade A-F, Pilot, Airframe)
      2. Health Trend Timeline with Event Markers (Highlighting Health < 80%)
      3. Parameter Deviations Table (Threshold excursions, duration, severity)
      4. Chronological AI Fault & Anomaly Log (Confidence %, pilot action)
      5. Efficiency Analysis (BSFC, Specific Air Range, Loss Attribution: Thermal 58%, Mech 8%, Aero 5%)
      6. Maintenance Recommendations & Labor Work Orders
      7. Digital Twin Accuracy (Physics vs Actuals, RMSE & MAE per parameter)
      8. Export Options (PDF Simulation via Print, CSV Download, Maintenance Sync)
=============================================================================
"""

import math
import random
import time
from datetime import datetime
import dash
from dash import dcc, html, Input, Output, State, callback_context, ALL
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px

# ---------------------------------------------------------------------------
# 1. THEME DEFINITION
# ---------------------------------------------------------------------------
THEME = {
    'bg_app': '#0a0e17',          # Dark HUD background
    'bg_card': '#0e1422',         # Card surface
    'bg_subtle': '#070b13',       # Sub-panel inset
    'border': '#16273f',          # Border
    'cyan': '#06b6d4',            # Cyan accent
    'magenta': '#d946ef',         # Magenta accent
    'white': '#ffffff',           # White
    'emerald': '#10b981',         # Green
    'amber': '#f59e0b',           # Amber
    'rose': '#ef4444',            # Red
    'text_primary': '#f1f5f9',    # Primary text
    'text_secondary': '#94a3b8',  # Muted text
    'font_sans': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'font_mono': '"JetBrains Mono", "Share Tech Mono", monospace',
}

CARD_STYLE = {
    'backgroundColor': THEME['bg_card'],
    'border': f"1px solid {THEME['border']}",
    'borderRadius': '8px',
    'padding': '14px',
    'marginBottom': '10px',
}

# ---------------------------------------------------------------------------
# 2. HISTORICAL MISSION DATABASE (5-10 PAST MISSIONS)
# ---------------------------------------------------------------------------
PAST_MISSIONS = [
    {
        'id': 'MISSION-027', 'date': '2026-09-26', 'duration': '01:42:15', 'alt': 8400, 'dist': 184.2,
        'health': 88, 'cht': 174.5, 'egt': 812, 'faults': 1, 'status': 'Degraded', 'grade': 'B',
        'pilot': 'Capt. R. Deshmukh', 'tail': 'UAV-07 (TAPAS-BH-201)',
        'summary': 'Completed high-altitude perimeter surveillance. While propulsion baseline remained operational, Cylinder 2 CHT elevated during climb step, generating a cooling advisory.'
    },
    {
        'id': 'MISSION-026', 'date': '2026-09-24', 'duration': '03:15:40', 'alt': 9200, 'dist': 310.5,
        'health': 94, 'cht': 161.2, 'egt': 778, 'faults': 0, 'status': 'Success', 'grade': 'A',
        'pilot': 'Flt. Lt. S. Iyer', 'tail': 'UAV-07 (TAPAS-BH-201)',
        'summary': 'Nominal long-endurance ISR sortie. Fuel consumption matched target zero-D digital twin curves within 1.2% with zero parameter threshold excursions.'
    },
    {
        'id': 'MISSION-025', 'date': '2026-09-21', 'duration': '02:40:10', 'alt': 8100, 'dist': 254.0,
        'health': 91, 'cht': 165.8, 'egt': 789, 'faults': 0, 'status': 'Success', 'grade': 'A',
        'pilot': 'Capt. R. Deshmukh', 'tail': 'UAV-07 (TAPAS-BH-201)',
        'summary': 'Standard border reconnaissance. Engine maintained continuous cruise envelope with oil pressure at 4.25 bar and steady cylinder balance.'
    },
    {
        'id': 'MISSION-024', 'date': '2026-09-18', 'duration': '00:54:30', 'alt': 5200, 'dist': 76.4,
        'health': 68, 'cht': 198.4, 'egt': 864, 'faults': 3, 'status': 'Aborted', 'grade': 'F',
        'pilot': 'Flt. Lt. S. Iyer', 'tail': 'UAV-07 (TAPAS-BH-201)',
        'summary': 'Sortie aborted at T+42 min following uncommanded oil pressure drop to 1.7 bar coupled with rapid CHT rise. Operator executed QRH Emergency and completed RTB glide recovery.'
    },
    {
        'id': 'MISSION-023', 'date': '2026-09-15', 'duration': '03:45:00', 'alt': 10400, 'dist': 365.0,
        'health': 89, 'cht': 172.0, 'egt': 805, 'faults': 1, 'status': 'Success', 'grade': 'B',
        'pilot': 'Capt. A. Verma', 'tail': 'UAV-07 (TAPAS-BH-201)',
        'summary': 'Maximum ceiling test flight. Turbocharger wastegate servo cycled frequently above 9,500 ft to maintain manifold pressure, logging a transient pressure ripple.'
    },
    {
        'id': 'MISSION-022', 'date': '2026-09-12', 'duration': '02:10:00', 'alt': 7800, 'dist': 215.8,
        'health': 95, 'cht': 159.0, 'egt': 772, 'faults': 0, 'status': 'Success', 'grade': 'A',
        'pilot': 'Flt. Lt. S. Iyer', 'tail': 'UAV-07 (TAPAS-BH-201)',
        'summary': 'Flawless calibration flight following 50-hour spark plug and filter maintenance. Telemetry confirmed 100% compression balance.'
    },
]

# ---------------------------------------------------------------------------
# 3. INITIALIZE DASH APPLICATION
# ---------------------------------------------------------------------------
app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.DARKLY],
    meta_tags=[{'name': 'viewport', 'content': 'width=device-width, initial-scale=1.0'}],
    suppress_callback_exceptions=True
)
app.title = "VIBESPAR Digital Twin GCS | Mission Reports"

# ---------------------------------------------------------------------------
# 4. REPORT MODULE LAYOUT GENERATORS
# ---------------------------------------------------------------------------
def render_reports_dashboard():
    """Renders table of all past missions with summary KPIs."""
    return html.Div([
        # Dashboard Filter & KPI Header
        html.Div(style={'backgroundColor': THEME['bg_card'], 'padding': '12px 18px', 'border': f"1px solid {THEME['border']}", 'borderRadius': '8px', 'marginBottom': '12px', 'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center'}, children=[
            html.Div([
                html.Span("MISSION-WISE FLIGHT HEALTH ARCHIVE", style={'fontWeight': 'bold', 'color': THEME['cyan'], 'fontSize': '13px'}),
                html.Span(" • 6 HISTORICAL SORTIES LOGGED", style={'color': THEME['text_secondary'], 'fontSize': '11px', 'marginLeft': '8px'}),
            ]),
            html.Div("Filter: ALL MISSIONS", style={'fontSize': '11px', 'fontFamily': THEME['font_mono'], 'color': THEME['text_secondary']})
        ]),

        # Missions Table
        html.Div(style=CARD_STYLE, children=[
            html.Table(style={'width': '100%', 'fontSize': '11px', 'fontFamily': THEME['font_mono']}, children=[
                html.Thead(html.Tr([
                    html.Th("MISSION ID"), html.Th("DATE"), html.Th("DURATION"), html.Th("ALTITUDE"),
                    html.Th("DISTANCE"), html.Th("AVG HEALTH"), html.Th("PEAK CHT/EGT"),
                    html.Th("FAULTS"), html.Th("STATUS"), html.Th("REPORT")
                ])),
                html.Tbody([
                    html.Tr([
                        html.Td(m['id'], style={'fontWeight': 'bold', 'color': THEME['cyan']}),
                        html.Td(m['date']),
                        html.Td(m['duration']),
                        html.Td(f"{m['alt']} ft"),
                        html.Td(f"{m['dist']} nm"),
                        html.Td(f"{m['health']}%", style={'color': THEME['emerald'] if m['health'] >= 90 else (THEME['amber'] if m['health'] >= 75 else THEME['rose']), 'fontWeight': 'bold'}),
                        html.Td(f"{m['cht']}°C / {m['egt']}°C"),
                        html.Td(m['faults'], style={'color': THEME['rose'] if m['faults'] > 0 else THEME['text_secondary']}),
                        html.Td(m['status'], style={'color': THEME['emerald'] if m['status'] == 'Success' else (THEME['amber'] if m['status'] == 'Degraded' else THEME['rose']), 'fontWeight': 'bold'}),
                        html.Td(dbc.Button(f"View {m['id']}", id={'type': 'btn-view-mission', 'index': m['id']}, size="sm", style={'fontSize': '9px', 'backgroundColor': '#0c1a2e', 'borderColor': THEME['cyan'], 'color': THEME['cyan']}))
                    ]) for m in PAST_MISSIONS
                ])
            ])
        ])
    ])

def render_individual_mission_report(mission_id='MISSION-027', active_section='summary'):
    """Renders the comprehensive 8-section aerospace mission report with sidebar navigation."""
    m = next((item for item in PAST_MISSIONS if item['id'] == mission_id), PAST_MISSIONS[0])

    # Section 2: Health Timeline Plot with Event Markers
    times = ['00:00', '00:15', '00:30', '00:45', '01:00', '01:20', '01:42']
    healths = [98, 96, 93, 78 if m['status'] == 'Degraded' else (65 if m['status'] == 'Aborted' else 92), 74 if m['status'] == 'Degraded' else 93, 82, m['health']]

    fig_timeline = go.Figure()
    fig_timeline.add_trace(go.Scatter(x=times, y=healths, mode='lines+markers', name="Health (%)", line={'color': THEME['cyan'], 'width': 2}))
    fig_timeline.add_hline(y=80, line_dash="dash", line_color=THEME['amber'], annotation_text="80% Threshold")
    fig_timeline.update_layout(
        paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
        font={'color': THEME['text_primary'], 'size': 10},
        yaxis={'range': [40, 100], 'title': 'Engine Health (%)'},
        margin={'t': 20, 'b': 20, 'l': 30, 'r': 20}, height=220
    )

    # Section 7: Digital Twin Prediction Accuracy Plot
    params = ['CHT (°C)', 'EGT (°C)', 'Oil P (bar)', 'MAP (inHg)', 'Fuel (L/h)']
    actuals = [162.4, 782.0, 4.22, 34.2, 18.2]
    expected = [161.8, 778.5, 4.25, 34.1, 18.0]

    fig_twin = go.Figure()
    fig_twin.add_trace(go.Bar(x=params, y=actuals, name="Actual Sensor Avg", marker_color=THEME['white']))
    fig_twin.add_trace(go.Bar(x=params, y=expected, name="Twin Predicted Avg", marker_color=THEME['cyan']))
    fig_twin.update_layout(
        barmode='group', paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
        font={'color': THEME['text_primary'], 'size': 10},
        margin={'t': 20, 'b': 20, 'l': 30, 'r': 20}, height=200
    )

    return html.Div([
        # Header Strip with Grade and Actions
        html.Div(style={'backgroundColor': THEME['bg_card'], 'padding': '12px 18px', 'border': f"1px solid {THEME['border']}", 'borderRadius': '8px', 'marginBottom': '12px', 'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center'}, children=[
            html.Div([
                html.Span(f"{m['id']} FLIGHT TEST & PROPULSION REPORT", style={'fontWeight': 'bold', 'color': THEME['cyan'], 'fontSize': '14px'}),
                html.Span(f" • Airframe: {m['tail']} • Pilot: {m['pilot']} • Grade: {m['grade']}", style={'color': THEME['text_secondary'], 'fontSize': '11px', 'marginLeft': '10px'}),
            ]),
            html.Div([
                dbc.Button("Download PDF / Print", id="btn-print-report", size="sm", style={'backgroundColor': '#102038', 'fontSize': '10px', 'marginRight': '6px'}),
                dcc.Download(id="download-mission-csv"),
                dbc.Button("Export Raw CSV", id="btn-export-csv", size="sm", style={'backgroundColor': '#102038', 'fontSize': '10px', 'marginRight': '6px'}),
                dbc.Button("Share with Maintenance", id="btn-share-report", size="sm", style={'backgroundColor': '#0d2238', 'borderColor': THEME['cyan'], 'fontSize': '10px', 'color': THEME['cyan']}),
            ])
        ]),

        # 2-Column Report Body (Sidebar Navigation + Report Content)
        dbc.Row([
            # Sidebar Navigation (3 cols)
            dbc.Col(html.Div(style=CARD_STYLE, children=[
                html.H6("REPORT SECTIONS", style={'color': THEME['text_secondary'], 'fontSize': '10px', 'fontWeight': 'bold', 'marginBottom': '8px'}),
                dbc.Nav(vertical=True, pills=True, children=[
                    dbc.NavLink("1. Executive Summary", id="nav-sec-summary", active=(active_section == 'summary'), style={'fontSize': '11px', 'cursor': 'pointer'}),
                    dbc.NavLink("2. Health Trend Timeline", id="nav-sec-health", active=(active_section == 'healthTrend'), style={'fontSize': '11px', 'cursor': 'pointer'}),
                    dbc.NavLink("3. Parameter Deviations", id="nav-sec-devs", active=(active_section == 'deviations'), style={'fontSize': '11px', 'cursor': 'pointer'}),
                    dbc.NavLink("4. Fault & Anomaly Log", id="nav-sec-faults", active=(active_section == 'faults'), style={'fontSize': '11px', 'cursor': 'pointer'}),
                    dbc.NavLink("5. Efficiency Analysis", id="nav-sec-eff", active=(active_section == 'efficiency'), style={'fontSize': '11px', 'cursor': 'pointer'}),
                    dbc.NavLink("6. Maintenance Advisory", id="nav-sec-maint", active=(active_section == 'maintenance'), style={'fontSize': '11px', 'cursor': 'pointer'}),
                    dbc.NavLink("7. Digital Twin Accuracy", id="nav-sec-twin", active=(active_section == 'twinAccuracy'), style={'fontSize': '11px', 'cursor': 'pointer'}),
                ]),
                html.Hr(style={'borderColor': THEME['border']}),
                dbc.Button("← Return to All Missions", id="btn-back-dashboard", size="sm", style={'fontSize': '10px', 'width': '100%', 'backgroundColor': '#122238'})
            ]), width=3),

            # Report Main Content (9 cols)
            dbc.Col(html.Div(style=CARD_STYLE, children=[
                # 1. Executive Summary
                html.Div(style={'display': 'block' if active_section == 'summary' else 'none'}, children=[
                    html.H6("1. EXECUTIVE SUMMARY & SORTIE SYNOPSIS", style={'color': THEME['cyan'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    html.P(m['summary'], style={'fontSize': '12px', 'padding': '10px', 'backgroundColor': THEME['bg_subtle'], 'borderRadius': '6px', 'border': f"1px solid {THEME['border']}"}),
                    dbc.Row([
                        dbc.Col(html.Div([html.Span("Sortie Duration: "), html.Strong(m['duration'])]), width=3),
                        dbc.Col(html.Div([html.Span("Distance Flown: "), html.Strong(f"{m['dist']} NM")]), width=3),
                        dbc.Col(html.Div([html.Span("Max Altitude: "), html.Strong(f"{m['alt']} FT")]), width=3),
                        dbc.Col(html.Div([html.Span("Average Health: "), html.Strong(f"{m['health']}%")]), width=3),
                    ], style={'fontSize': '11px', 'fontFamily': THEME['font_mono'], 'marginTop': '10px'})
                ]),

                # 2. Health Trend Timeline
                html.Div(style={'display': 'block' if active_section == 'healthTrend' else 'none'}, children=[
                    html.H6("2. ENGINE HEALTH TIMELINE & IN-FLIGHT EVENTS", style={'color': THEME['cyan'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    dcc.Graph(figure=fig_timeline, config={'displayModeBar': False})
                ]),

                # 3. Parameter Deviations
                html.Div(style={'display': 'block' if active_section == 'deviations' else 'none'}, children=[
                    html.H6("3. FLIGHT ENVELOPE SAFETY THRESHOLD DEVIATIONS", style={'color': THEME['amber'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    html.Table(style={'width': '100%', 'fontSize': '11px', 'fontFamily': THEME['font_mono']}, children=[
                        html.Thead(html.Tr([html.Th("PARAMETER"), html.Th("TIME"), html.Th("DURATION"), html.Th("MAX VALUE"), html.Th("SEVERITY")])),
                        html.Tbody([
                            html.Tr([html.Td("Cylinder 2 CHT Delta"), html.Td("00:48:30"), html.Td("18 min"), html.Td("+18.4°C Δ", style={'color': THEME['amber']}), html.Td("WARNING")]),
                            html.Tr([html.Td("Collector EGT Peak"), html.Td("00:52:10"), html.Td("6 min"), html.Td("812.0°C", style={'color': THEME['amber']}), html.Td("CAUTION")]),
                        ])
                    ])
                ]),

                # 4. Fault & Anomaly Log
                html.Div(style={'display': 'block' if active_section == 'faults' else 'none'}, children=[
                    html.H6("4. CHRONOLOGICAL AI FAULT & ANOMALY LOG", style={'color': THEME['cyan'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    html.Div(style={'padding': '10px', 'backgroundColor': THEME['bg_subtle'], 'borderRadius': '6px', 'border': f"1px solid {THEME['border']}", 'fontSize': '11px'}, children=[
                        html.Div("• [00:45:10] Injector Nozzle Clogging (Confidence: 92%) — Component: Cylinder 2 Fuel Injector", style={'fontWeight': 'bold'}),
                        html.Div("Recommended Action: Trim fuel mixture +3% and reduce cruise throttle. Pilot Executed: YES", style={'color': THEME['emerald'], 'marginLeft': '12px'}),
                    ])
                ]),

                # 5. Efficiency Analysis
                html.Div(style={'display': 'block' if active_section == 'efficiency' else 'none'}, children=[
                    html.H6("5. FUEL EFFICIENCY & SPECIFIC AIR RANGE", style={'color': THEME['emerald'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    html.P("Specific Air Range: 5.79 NM / L (+3.8% vs Fleet Baseline). BSFC: 304 g/kWh.", style={'fontSize': '11px'}),
                    html.Div("Efficiency Loss Attribution: Thermal 58.4% • Mechanical 8.2% • Aerodynamic Pumping 4.6%", style={'padding': '8px', 'backgroundColor': THEME['bg_subtle'], 'fontSize': '11px', 'fontFamily': THEME['font_mono']})
                ]),

                # 6. Maintenance Advisory
                html.Div(style={'display': 'block' if active_section == 'maintenance' else 'none'}, children=[
                    html.H6("6. POST-MISSION MAINTENANCE ACTIONS & WORK ORDERS", style={'color': THEME['amber'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    html.Ul(style={'fontSize': '11px'}, children=[
                        html.Li("Perform ultrasonic bath cleaning on Cylinder 2 injector nozzle (Labor: 1.5 hrs)."),
                        html.Li("Borescope inspection of Cylinder 2 exhaust valve seat (Labor: 1.0 hrs)."),
                        html.Li("Routine oil filter cartridge replacement (Labor: 0.8 hrs)."),
                    ])
                ]),

                # 7. Digital Twin Accuracy
                html.Div(style={'display': 'block' if active_section == 'twinAccuracy' else 'none'}, children=[
                    html.H6("7. DIGITAL TWIN ACCURACY (RMSE & MAE EVALUATION)", style={'color': THEME['cyan'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    dcc.Graph(figure=fig_twin, config={'displayModeBar': False}),
                    html.Div("Overall Model Fidelity: 98.6% • CHT RMSE: 1.42°C • EGT RMSE: 4.15°C • Oil Press RMSE: 0.06 bar", style={'fontSize': '10px', 'fontFamily': THEME['font_mono'], 'color': THEME['emerald']})
                ]),
            ]), width=9)
        ])
    ])

# ---------------------------------------------------------------------------
# 4.B EDGE AI & CYBER-PHYSICAL SECURITY MONITORING PANEL
# ---------------------------------------------------------------------------
def render_edge_ai_and_security_panel():
    # 1. Inference Latency Comparison Chart
    fig_infer = go.Figure(go.Bar(
        x=[285.0, 48.2, 21.4],
        y=['Cloud GCS (RF Link)', 'Hybrid (Edge Filter + Cloud)', 'Onboard Edge TensorRT'],
        orientation='h',
        marker=dict(color=[THEME['rose'], THEME['amber'], THEME['cyan']]),
        text=['285.0 ms (High Jitter)', '48.2 ms (Boundary)', '21.4 ms (Target <50ms Met)'],
        textposition='inside',
        insidetextanchor='end'
    ))
    fig_infer.update_layout(
        template='plotly_dark',
        paper_bgcolor=THEME['bg_subtle'],
        plot_bgcolor=THEME['bg_subtle'],
        margin=dict(l=10, r=20, t=10, b=10),
        height=180,
        xaxis=dict(title='Latency (ms)', gridcolor='#15253b'),
        yaxis=dict(gridcolor='#15253b')
    )

    # 2. SHAP Waterfall Chart
    shap_features = ['Gov RPM Stabil', 'Oil Press Norm', 'Vibr Harmonics', 'EGT Residual', 'Cyl 2 CHT Exceed', 'Fuel Flow Drop']
    shap_vals = [-0.02, -0.05, 0.07, 0.14, 0.24, 0.34]
    shap_colors = [THEME['emerald'] if v < 0 else THEME['rose'] for v in shap_vals]
    fig_shap = go.Figure(go.Bar(
        x=shap_vals,
        y=shap_features,
        orientation='h',
        marker_color=shap_colors,
        text=[f"{v:+.2f}" for v in shap_vals],
        textposition='outside'
    ))
    fig_shap.update_layout(
        template='plotly_dark',
        paper_bgcolor=THEME['bg_subtle'],
        plot_bgcolor=THEME['bg_subtle'],
        margin=dict(l=10, r=40, t=10, b=10),
        height=200,
        xaxis=dict(title='SHAP Value Contribution to Fault Likelihood', gridcolor='#15253b', zerolinecolor='#334155'),
        yaxis=dict(gridcolor='#15253b')
    )

    # 3. Federated Learning Accuracy Progression Chart
    rounds = [f"R{i}" for i in range(1, 15)]
    accuracies = [91.2, 92.4, 93.5, 94.2, 94.8, 95.3, 95.9, 96.4, 96.8, 97.2, 97.6, 98.1, 98.2, 98.6]
    fig_fed = go.Figure(go.Scatter(
        x=rounds, y=accuracies,
        mode='lines+markers',
        line=dict(color=THEME['cyan'], width=2.5),
        marker=dict(size=6, color=THEME['emerald']),
        fill='tozeroy',
        fillcolor='rgba(6,182,212,0.1)'
    ))
    fig_fed.update_layout(
        template='plotly_dark',
        paper_bgcolor=THEME['bg_subtle'],
        plot_bgcolor=THEME['bg_subtle'],
        margin=dict(l=10, r=20, t=10, b=10),
        height=170,
        yaxis=dict(title='Global Accuracy (%)', range=[90, 100], gridcolor='#15253b'),
        xaxis=dict(gridcolor='#15253b')
    )

    # 4. Model Confidence Calibration
    pred_bins = [0.1, 0.25, 0.45, 0.65, 0.85, 0.98]
    emp_acc = [0.09, 0.26, 0.44, 0.67, 0.84, 0.97]
    fig_calib = go.Figure()
    fig_calib.add_trace(go.Scatter(x=[0, 1], y=[0, 1], mode='lines', line=dict(color='#64748b', dash='dash'), name='Perfect Calibration'))
    fig_calib.add_trace(go.Scatter(x=pred_bins, y=emp_acc, mode='lines+markers', line=dict(color=THEME['emerald'], width=2), marker=dict(size=7, color=THEME['cyan']), name='Current Model (Brier: 0.034)'))
    fig_calib.update_layout(
        template='plotly_dark',
        paper_bgcolor=THEME['bg_subtle'],
        plot_bgcolor=THEME['bg_subtle'],
        margin=dict(l=10, r=10, t=10, b=10),
        height=170,
        showlegend=False,
        xaxis=dict(title='Predicted Probability', range=[0, 1], gridcolor='#15253b'),
        yaxis=dict(title='Empirical Accuracy', range=[0, 1], gridcolor='#15253b')
    )

    return html.Div(style={'display': 'flex', 'flexDirection': 'column', 'gap': '14px'}, children=[
        # Banner
        html.Div(style={**CARD_STYLE, 'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center', 'border': f"1px solid {THEME['cyan']}"}, children=[
            html.Div([
                html.H4("EDGE AI & CYBER-PHYSICAL SECURITY ARCHITECTURE (SIH 2026)", style={'color': THEME['cyan'], 'margin': 0, 'fontWeight': '900', 'fontFamily': THEME['font_mono'], 'fontSize': '16px'}),
                html.P("Real-time onboard inference • INT8 Quantization • Differential Privacy Federated Learning • Real-Time SHAP XAI • Secure CAN Bus Monitor", style={'margin': 0, 'fontSize': '12px', 'color': THEME['text_secondary']}),
            ]),
            html.Div([
                html.Span("🔒 AES-256-GCM ACTIVE", style={'color': THEME['emerald'], 'fontWeight': 'bold', 'marginRight': '14px', 'fontFamily': THEME['font_mono'], 'fontSize': '12px'}),
                html.Span("⚡ LATENCY: 21.4 ms", style={'color': THEME['cyan'], 'fontWeight': 'bold', 'fontFamily': THEME['font_mono'], 'fontSize': '12px'}),
            ])
        ]),

        # SUB-PANEL 1: Computing Stack & Edge Device Status
        html.Div(style=CARD_STYLE, children=[
            html.H5("SUB-PANEL 1 — ONBOARD COMPUTING STACK & EDGE DEVICE STATUS", style={'color': THEME['cyan'], 'fontSize': '13px', 'fontWeight': 'bold'}),
            # Computing Stack Flow
            html.Div(style={'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center', 'padding': '14px 10px', 'backgroundColor': THEME['bg_subtle'], 'borderRadius': '6px', 'marginBottom': '12px'}, children=[
                html.Div(style={'textAlign': 'center', 'padding': '8px', 'border': f"1px solid {THEME['border']}", 'borderRadius': '4px', 'width': '18%'}, children=[
                    html.Div("STAGE 1", style={'fontSize': '9px', 'color': THEME['cyan']}),
                    html.B("UAV Airframe", style={'fontSize': '12px'}),
                    html.Div("Rotax 914-F Turbo", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("● 18 Sensors Online", style={'color': THEME['emerald'], 'fontSize': '10px', 'marginTop': '4px'})
                ]),
                html.Div("CAN 2.0B ➔", style={'color': THEME['cyan'], 'fontFamily': THEME['font_mono'], 'fontSize': '10px'}),
                html.Div(style={'textAlign': 'center', 'padding': '8px', 'border': f"1px solid {THEME['border']}", 'borderRadius': '4px', 'width': '18%'}, children=[
                    html.Div("STAGE 2", style={'fontSize': '9px', 'color': THEME['cyan']}),
                    html.B("ECU / TCU", style={'fontSize': '12px'}),
                    html.Div("Dual-Core FADEC", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("● 100 Hz Sampling", style={'color': THEME['emerald'], 'fontSize': '10px', 'marginTop': '4px'})
                ]),
                html.Div("SPI / CAN-FD ➔", style={'color': THEME['cyan'], 'fontFamily': THEME['font_mono'], 'fontSize': '10px'}),
                html.Div(style={'textAlign': 'center', 'padding': '8px', 'border': f"2px solid {THEME['cyan']}", 'borderRadius': '4px', 'width': '22%', 'backgroundColor': '#0a192e'}, children=[
                    html.Div("CORE EDGE AI", style={'fontSize': '9px', 'color': THEME['cyan'], 'fontWeight': 'bold'}),
                    html.B("NVIDIA Jetson Orin", style={'fontSize': '12px', 'color': THEME['cyan']}),
                    html.Div("TensorRT INT8 Engine", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("● INFERENCE: 21.4 ms", style={'color': THEME['emerald'], 'fontSize': '10px', 'fontWeight': 'bold', 'marginTop': '4px'})
                ]),
                html.Div("AES-256 ➔", style={'color': THEME['emerald'], 'fontFamily': THEME['font_mono'], 'fontSize': '10px'}),
                html.Div(style={'textAlign': 'center', 'padding': '8px', 'border': f"1px solid {THEME['border']}", 'borderRadius': '4px', 'width': '18%'}, children=[
                    html.Div("STAGE 4", style={'fontSize': '9px', 'color': THEME['cyan']}),
                    html.B("Telemetry Radio", style={'fontSize': '12px'}),
                    html.Div("COFDM S-Band", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("● RSSI: -64 dBm", style={'color': THEME['emerald'], 'fontSize': '10px', 'marginTop': '4px'})
                ]),
                html.Div("RF Link ➔", style={'color': THEME['amber'], 'fontFamily': THEME['font_mono'], 'fontSize': '10px'}),
                html.Div(style={'textAlign': 'center', 'padding': '8px', 'border': f"1px solid {THEME['border']}", 'borderRadius': '4px', 'width': '18%'}, children=[
                    html.Div("STAGE 5", style={'fontSize': '9px', 'color': THEME['cyan']}),
                    html.B("Ground Station", style={'fontSize': '12px'}),
                    html.Div("VIBESPAR Digital Twin", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("● SYNC: LIVE (0.0s)", style={'color': THEME['emerald'], 'fontSize': '10px', 'marginTop': '4px'})
                ]),
            ]),
            # Technical metrics cards
            dbc.Row([
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px'}, children=[
                    html.Div("NODE STATE", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("● ONLINE (Uptime: 01:24:48)", style={'color': THEME['emerald'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                ]), width=2),
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px'}, children=[
                    html.Div("CPU / GPU LOAD", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("38% Load (8 Cores)", style={'color': THEME['cyan'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                ]), width=2),
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px'}, children=[
                    html.Div("LPDDR5 RAM", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("3.5 GB / 8.0 GB", style={'color': THEME['text_primary'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                ]), width=2),
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px'}, children=[
                    html.Div("SOC TEMPERATURE", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("51.2 °C (Safe < 95°C)", style={'color': THEME['amber'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                ]), width=2),
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px', 'border': f"1px solid {THEME['cyan']}"}, children=[
                    html.Div("EDGE LATENCY (Target <50ms)", style={'fontSize': '10px', 'color': THEME['cyan'], 'fontWeight': 'bold'}),
                    html.Div("21.4 ms (PASS - 57% Margin)", style={'color': THEME['emerald'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                ]), width=2),
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px'}, children=[
                    html.Div("MODEL VERSION", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("v2.4.1-int8-edge", style={'color': THEME['text_primary'], 'fontWeight': 'bold', 'fontSize': '11px', 'fontFamily': THEME['font_mono']}),
                    dbc.Button("Push Model Update", id="btn-py-push-ota", color="info", size="sm", style={'fontSize': '10px', 'marginTop': '4px', 'width': '100%'})
                ]), width=2),
            ])
        ]),

        # SUB-PANEL 2: Lightweight Onboard Analytics
        html.Div(style=CARD_STYLE, children=[
            html.H5("SUB-PANEL 2 — LIGHTWEIGHT ONBOARD ANALYTICS & COMPRESSION", style={'color': THEME['cyan'], 'fontSize': '13px', 'fontWeight': 'bold'}),
            dbc.Row([
                dbc.Col([
                    html.H6("Inference Latency Comparison (Hard Real-Time Guarantee)", style={'fontSize': '11px', 'color': THEME['text_secondary']}),
                    dcc.Graph(figure=fig_infer, config={'displayModeBar': False})
                ], width=6),
                dbc.Col([
                    html.H6("Hardware Footprint & Model Compression Status", style={'fontSize': '11px', 'color': THEME['text_secondary']}),
                    dbc.Row([
                        dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '4px', 'marginBottom': '6px'}, children=[
                            html.Div("MODEL MEMORY FOOTPRINT", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                            html.Div("42.6 MB (↓ 91.2% vs 485MB FP32)", style={'color': THEME['cyan'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                        ]), width=6),
                        dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '4px', 'marginBottom': '6px'}, children=[
                            html.Div("POWER CONSUMPTION", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                            html.Div("8.4 Watts (12V Avionics Bus)", style={'color': THEME['amber'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                        ]), width=6),
                    ]),
                    html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '8px', 'borderRadius': '4px', 'fontSize': '11px', 'fontFamily': THEME['font_mono'], 'lineHeight': '1.5'}, children=[
                        html.Div("● Quantization: INT8 Post-Training (PTQ) + Entropy Calibration (99.4% Acc Retained)", style={'color': THEME['emerald']}),
                        html.Div("● Structured Pruning: 2:4 Sparsity on Tensor Cores (42% weights pruned)", style={'color': THEME['cyan']}),
                        html.Div("● Graph Fusion: TensorRT 10.2 Conv+BN+ReLU Operator Fusion (38 kernels eliminated)", style={'color': THEME['text_secondary']}),
                    ])
                ], width=6),
            ])
        ]),

        # SUB-PANEL 3: Secure Telemetry & CAN Bus Monitor
        html.Div(style=CARD_STYLE, children=[
            html.H5("SUB-PANEL 3 — SECURE TELEMETRY & CAN BUS MONITOR", style={'color': THEME['cyan'], 'fontSize': '13px', 'fontWeight': 'bold'}),
            dbc.Row([
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px'}, children=[
                    html.Div("ENCRYPTION PROTOCOL", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("🔒 AES-256-GCM Active (ECDH Curve25519)", style={'color': THEME['emerald'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                ]), width=3),
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px'}, children=[
                    html.Div("CRC ERROR RATE", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("0.002% (Nominal < 0.05%)", style={'color': THEME['emerald'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                ]), width=3),
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px'}, children=[
                    html.Div("PACKET LOSS & LATENCY", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("0.12% Loss • 28 ms Latency", style={'color': THEME['cyan'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                ]), width=3),
                dbc.Col(html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px'}, children=[
                    html.Div("TELEMETRY BANDWIDTH GAUGE", style={'fontSize': '10px', 'color': THEME['text_secondary']}),
                    html.Div("64.8 / 128.0 kbps (50.6% Cap)", style={'color': THEME['emerald'], 'fontWeight': 'bold', 'fontSize': '12px', 'fontFamily': THEME['font_mono']})
                ]), width=3),
            ], style={'marginBottom': '10px'}),
            # CAN Frame Table
            html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '8px', 'borderRadius': '6px'}, children=[
                html.Div("LIVE CAN BUS LOG (ISO 11898 CAN 2.0B / CAN-FD)", style={'fontSize': '10px', 'color': THEME['cyan'], 'fontWeight': 'bold', 'marginBottom': '6px'}),
                dbc.Table([
                    html.Thead(html.Tr([
                        html.Th("CAN ID"), html.Th("Source"), html.Th("Signal Name"), html.Th("Timestamp"), html.Th("Data Bytes (Hex)"), html.Th("DLC"), html.Th("Status")
                    ], style={'fontSize': '10px', 'color': THEME['text_secondary']})),
                    html.Tbody([
                        html.Tr([html.Td("0x120", style={'color': THEME['cyan'], 'fontWeight': 'bold'}), html.Td("ENGINE"), html.Td("CRANK_RPM_PHASE"), html.Td("12:47:04.281"), html.Td("4A 02 8F 1C 00 E3 12 90"), html.Td("8"), html.Td("✓ VALID", style={'color': THEME['emerald']})]),
                        html.Tr([html.Td("0x140", style={'color': THEME['cyan'], 'fontWeight': 'bold'}), html.Td("ENGINE"), html.Td("CHT_CYL_1_TO_4"), html.Td("12:47:04.290"), html.Td("98 A1 00 C4 01 22 1F 80"), html.Td("8"), html.Td("✓ VALID", style={'color': THEME['emerald']})]),
                        html.Tr([html.Td("0x160", style={'color': THEME['cyan'], 'fontWeight': 'bold'}), html.Td("ENGINE"), html.Td("EGT_COLLECTORS"), html.Td("12:47:04.305"), html.Td("F1 02 BC 14 00 9A 44 11"), html.Td("8"), html.Td("✓ VALID", style={'color': THEME['emerald']})]),
                        html.Tr([html.Td("0x180", style={'color': THEME['cyan'], 'fontWeight': 'bold'}), html.Td("ENGINE"), html.Td("OIL_PRESS_TEMP"), html.Td("12:47:04.312"), html.Td("04 12 88 FC 00 1E AA FF"), html.Td("8"), html.Td("✓ VALID", style={'color': THEME['emerald']})]),
                        html.Tr([html.Td("0x210", style={'color': THEME['cyan'], 'fontWeight': 'bold'}), html.Td("AVIONICS"), html.Td("AIR_DATA_PITOT"), html.Td("12:47:04.328"), html.Td("18 00 CC 31 02 A4 81 22"), html.Td("8"), html.Td("✓ VALID", style={'color': THEME['emerald']})]),
                        html.Tr([html.Td("0x142", style={'color': THEME['rose'], 'fontWeight': 'bold'}), html.Td("ENGINE"), html.Td("INJECTOR_C2_FAIL"), html.Td("12:47:04.340"), html.Td("FF FF 00 00 E1 9A 02 44"), html.Td("8"), html.Td("⚠ ANOMALOUS FRAME", style={'color': THEME['rose'], 'fontWeight': 'bold'})], style={'backgroundColor': 'rgba(239,68,68,0.1)'}),
                    ], style={'fontSize': '11px', 'fontFamily': THEME['font_mono']})
                ], bordered=True, hover=True, size="sm")
            ])
        ]),

        # SUB-PANEL 4: Federated Learning Status
        html.Div(style=CARD_STYLE, children=[
            html.H5("SUB-PANEL 4 — FEDERATED LEARNING STATUS (FLEET AGGREGATION & PRIVACY)", style={'color': THEME['cyan'], 'fontSize': '13px', 'fontWeight': 'bold'}),
            dbc.Row([
                dbc.Col([
                    html.H6("Participating UAV Fleet (Local Accuracy)", style={'fontSize': '11px', 'color': THEME['text_secondary']}),
                    html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px', 'fontSize': '11px', 'fontFamily': THEME['font_mono']}, children=[
                        html.Div("• UAV-07 (Current Sortie - TAPAS Mission 027): 98.4% Acc [TRAINING ACTIVE]", style={'color': THEME['cyan'], 'fontWeight': 'bold'}),
                        html.Div("• UAV-03 (Kolkata Airbase): 97.9% Acc [WEIGHTS READY]", style={'color': THEME['text_secondary']}),
                        html.Div("• UAV-12 (Jaisalmer Desert Flight): 98.8% Acc [SYNCED]", style={'color': THEME['emerald']}),
                        html.Div("• UAV-05 (Bengaluru HAL Facility): 96.5% Acc [TRAINING]", style={'color': THEME['text_secondary']}),
                        html.Div("• UAV-09 (Chandipur Coastal Strip): 98.1% Acc [SYNCED]", style={'color': THEME['emerald']}),
                    ]),
                    html.Div("Privacy Guarantee: Differential Privacy (ε = 1.0, δ = 1e-5) Active. Zero flight data leaves airframe; only noisy gradients are aggregated.", style={'fontSize': '10px', 'color': THEME['emerald'], 'marginTop': '6px'})
                ], width=6),
                dbc.Col([
                    html.H6("Global Aggregated Model Accuracy Progression (FedAvg)", style={'fontSize': '11px', 'color': THEME['text_secondary']}),
                    dcc.Graph(figure=fig_fed, config={'displayModeBar': False}),
                    html.Div("Last Federation: Round #14 (5/5 nodes) • Improvement Delta: +0.42% F1-score", style={'fontSize': '10px', 'color': THEME['cyan'], 'fontFamily': THEME['font_mono']})
                ], width=6),
            ])
        ]),

        # SUB-PANEL 5: Explainable AI Console
        html.Div(style=CARD_STYLE, children=[
            html.H5("SUB-PANEL 5 — EXPLAINABLE AI CONSOLE (REAL-TIME SHAP WATERFALL)", style={'color': THEME['cyan'], 'fontSize': '13px', 'fontWeight': 'bold'}),
            # Narrative box
            html.Div(style={'backgroundColor': '#0a192e', 'border': f"1px solid {THEME['cyan']}", 'padding': '10px', 'borderRadius': '6px', 'marginBottom': '10px'}, children=[
                html.B("NATURAL LANGUAGE XAI EXPLANATION: ", style={'color': THEME['cyan'], 'fontSize': '11px'}),
                html.Span("\"The model flagged this as INJECTOR CLOGGING because Fuel Flow dropped 14% while Cylinder 2 Temperature rose 18°C above expected, causing cyclic torque imbalance and lean flame delay.\"", style={'fontSize': '12px', 'color': THEME['text_primary'], 'fontStyle': 'italic'})
            ]),
            dbc.Row([
                dbc.Col([
                    html.H6("Real-Time SHAP Waterfall (Base E[f(x)]=0.12 ➔ Output f(x)=0.88)", style={'fontSize': '11px', 'color': THEME['text_secondary']}),
                    dcc.Graph(figure=fig_shap, config={'displayModeBar': False})
                ], width=7),
                dbc.Col([
                    html.H6("Model Confidence Calibration (Reliability Diagram)", style={'fontSize': '11px', 'color': THEME['text_secondary']}),
                    dcc.Graph(figure=fig_calib, config={'displayModeBar': False}),
                    html.Div("Feature Ranking: 1. CHT (28.4%) • 2. EGT (24.1%) • 3. Fuel Flow (18.7%) • 4. Vibration (12.8%) • 5. Oil Press (10.5%) • 6. RPM (5.5%)", style={'fontSize': '10px', 'color': THEME['text_secondary'], 'fontFamily': THEME['font_mono']})
                ], width=5),
            ])
        ])
    ])

# ---------------------------------------------------------------------------
# 4.C AUTONOMOUS MAINTENANCE ADVISORY SYSTEM (AMAS)
# ---------------------------------------------------------------------------
def render_autonomous_maintenance_advisory_system():
    # Before/After Gauge 1: Mission Readiness (Immediate vs Deferred)
    fig_readiness_gauge = go.Figure()
    fig_readiness_gauge.add_trace(go.Indicator(
        mode="gauge+number+delta",
        value=62,
        delta={'reference': 98, 'increasing': {'color': THEME['emerald']}, 'decreasing': {'color': THEME['rose']}},
        title={'text': "<b>Mission Readiness Delta</b><br><span style='font-size:10px;color:#94a3b8'>Immediate: 98% | Deferred +15h: 62%</span>"},
        gauge={
            'axis': {'range': [0, 100], 'tickcolor': THEME['text_secondary']},
            'bar': {'color': THEME['amber']},
            'steps': [
                {'range': [0, 50], 'color': 'rgba(244,63,94,0.3)'},
                {'range': [50, 80], 'color': 'rgba(245,158,11,0.3)'},
                {'range': [80, 100], 'color': 'rgba(16,185,129,0.3)'},
            ],
            'threshold': {'line': {'color': THEME['emerald'], 'width': 3}, 'thickness': 0.75, 'value': 98}
        }
    ))
    fig_readiness_gauge.update_layout(
        template='plotly_dark',
        paper_bgcolor=THEME['bg_subtle'],
        margin=dict(l=25, r=25, t=40, b=20),
        height=190
    )

    # Before/After Gauge 2: In-Flight Failure Risk Score (Nominal vs Deferred)
    fig_risk_gauge = go.Figure()
    fig_risk_gauge.add_trace(go.Indicator(
        mode="gauge+number+delta",
        value=76,
        delta={'reference': 18, 'increasing': {'color': THEME['rose']}, 'decreasing': {'color': THEME['emerald']}},
        title={'text': "<b>In-Flight Failure Risk</b><br><span style='font-size:10px;color:#94a3b8'>Nominal: 18% | Deferred +15h: 76%</span>"},
        gauge={
            'axis': {'range': [0, 100], 'tickcolor': THEME['text_secondary']},
            'bar': {'color': THEME['rose']},
            'steps': [
                {'range': [0, 30], 'color': 'rgba(16,185,129,0.3)'},
                {'range': [30, 65], 'color': 'rgba(245,158,11,0.3)'},
                {'range': [65, 100], 'color': 'rgba(244,63,94,0.4)'},
            ],
            'threshold': {'line': {'color': THEME['rose'], 'width': 3}, 'thickness': 0.75, 'value': 80}
        }
    ))
    fig_risk_gauge.update_layout(
        template='plotly_dark',
        paper_bgcolor=THEME['bg_subtle'],
        margin=dict(l=25, r=25, t=40, b=20),
        height=190
    )

    # Digital Twin vs Actual Wear Comparison Chart
    hours = [f"T+{h}h" for h in range(0, 110, 10)]
    twin_wear = [round((math.pow(h/100, 1.35) * 45), 1) for h in range(0, 110, 10)]
    actual_wear = [round(tw + (h * 0.14 if h > 40 else 0) + (1.4 if h > 50 else 0.4), 1) for h, tw in zip(range(0, 110, 10), twin_wear)]

    fig_wear = go.Figure()
    fig_wear.add_trace(go.Scatter(
        x=hours, y=twin_wear,
        mode='lines',
        name='Twin Predicted Wear (%)',
        line=dict(color=THEME['cyan'], width=2.5),
        fill='tozeroy',
        fillcolor='rgba(6,182,212,0.1)'
    ))
    fig_wear.add_trace(go.Scatter(
        x=hours, y=actual_wear,
        mode='lines+markers',
        name='Actual Sensor Wear (%)',
        line=dict(color=THEME['amber'], width=2.5, dash='dot'),
        marker=dict(size=6, color=THEME['rose'])
    ))
    fig_wear.update_layout(
        template='plotly_dark',
        paper_bgcolor=THEME['bg_subtle'],
        plot_bgcolor=THEME['bg_subtle'],
        margin=dict(l=20, r=20, t=25, b=20),
        height=210,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=10)),
        xaxis=dict(title='Operating Flight Hours', gridcolor='#15253b'),
        yaxis=dict(title='Cumulative Wear Index (%)', gridcolor='#15253b')
    )

    return html.Div(style={'display': 'flex', 'flexDirection': 'column', 'gap': '14px'}, children=[
        # Banner Header
        html.Div(style={'backgroundColor': THEME['bg_card'], 'border': f"1px solid {THEME['border']}", 'padding': '14px 18px', 'borderRadius': '8px', 'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center'}, children=[
            html.Div([
                html.H4("AUTONOMOUS MAINTENANCE ADVISORY SYSTEM (AMAS)", style={'color': THEME['white'], 'margin': 0, 'fontSize': '15px', 'fontWeight': 'bold'}),
                html.P("Predictive Analytics Engine • Proactive Failure Prevention • Priority Queue Ranking • Digital Twin Wear Divergence", style={'color': THEME['text_secondary'], 'fontSize': '11px', 'margin': '4px 0 0 0'})
            ]),
            html.Div(style={'display': 'flex', 'gap': '12px', 'alignItems': 'center'}, children=[
                html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '6px 12px', 'borderRadius': '6px', 'textAlign': 'right'}, children=[
                    html.Div("ADVISOR ACCURACY", style={'fontSize': '9px', 'color': THEME['text_secondary']}),
                    html.Div("94.6% (48/51 Validated)", style={'fontSize': '12px', 'fontWeight': 'bold', 'color': THEME['emerald'], 'fontFamily': THEME['font_mono']})
                ]),
                html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '6px 12px', 'borderRadius': '6px', 'textAlign': 'right'}, children=[
                    html.Div("QUEUE STATUS", style={'fontSize': '9px', 'color': THEME['text_secondary']}),
                    html.Div("6 Actions Ranked", style={'fontSize': '12px', 'fontWeight': 'bold', 'color': THEME['cyan'], 'fontFamily': THEME['font_mono']})
                ])
            ])
        ]),

        # Row 1: Feature 1 (AI Maintenance Advisor Chat) + Feature 2 (Maintenance Priority Queue)
        dbc.Row([
            # FEATURE 1: Predictive Advisory Engine (Chat-like UI)
            dbc.Col(html.Div(style={'backgroundColor': THEME['bg_card'], 'border': f"1px solid {THEME['border']}", 'padding': '16px', 'borderRadius': '8px', 'height': '100%'}, children=[
                html.Div(style={'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center', 'marginBottom': '10px', 'borderBottom': f"1px solid {THEME['border']}", 'paddingBottom': '8px'}, children=[
                    html.Span("⚡ AI MAINTENANCE ADVISOR [PREDICTIVE CONSOLE]", style={'color': THEME['cyan'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    html.Span("● ONLINE (Weibull-LSTM)", style={'color': THEME['emerald'], 'fontSize': '10px', 'fontFamily': THEME['font_mono']})
                ]),

                # Conversational bubbles
                html.Div(style={'display': 'flex', 'flexDirection': 'column', 'gap': '10px', 'maxHeight': '420px', 'overflowY': 'auto', 'paddingRight': '6px'}, children=[
                    # Advisory Bubble 1
                    html.Div(style={'backgroundColor': '#08182b', 'border': f"1px solid rgba(6,182,212,0.4)", 'borderRadius': '8px 8px 8px 0px', 'padding': '10px', 'boxShadow': '0 0 10px rgba(6,182,212,0.1)'}, children=[
                        html.Div("⚡ ADVISORY 01 • 10:42 UTC", style={'color': THEME['cyan'], 'fontSize': '10px', 'fontWeight': 'bold', 'marginBottom': '4px'}),
                        html.P("Based on current vibration trends, main bearing inspection recommended within next 15 flight hours.", style={'fontSize': '11px', 'color': THEME['text_primary'], 'margin': 0}),
                        html.Div(style={'backgroundColor': '#05101d', 'padding': '6px 8px', 'borderRadius': '4px', 'marginTop': '6px', 'fontSize': '10px', 'fontFamily': THEME['font_mono']}, children=[
                            html.Span("Confidence: 94% | TTF: 14.5h | Cost: $450 | Downtime: 2.5h", style={'color': THEME['amber']}),
                            html.Div("Action: Borescope journal inspection & ultrasonic vibration probe", style={'color': THEME['text_secondary'], 'marginTop': '2px'})
                        ])
                    ]),

                    # Advisory Bubble 2
                    html.Div(style={'backgroundColor': '#08182b', 'border': f"1px solid rgba(6,182,212,0.4)", 'borderRadius': '8px 8px 8px 0px', 'padding': '10px'}, children=[
                        html.Div("⚡ ADVISORY 02 • 10:45 UTC", style={'color': THEME['cyan'], 'fontSize': '10px', 'fontWeight': 'bold', 'marginBottom': '4px'}),
                        html.P("Cylinder 3 CHT rising 2% per mission. Schedule cooling system check after Mission #12.", style={'fontSize': '11px', 'color': THEME['text_primary'], 'margin': 0}),
                        html.Div(style={'backgroundColor': '#05101d', 'padding': '6px 8px', 'borderRadius': '4px', 'marginTop': '6px', 'fontSize': '10px', 'fontFamily': THEME['font_mono']}, children=[
                            html.Span("Confidence: 89% | TTF: 28.0h | Cost: $280 | Downtime: 1.8h", style={'color': THEME['amber']}),
                            html.Div("Action: Check ram-air cooling plenum duct & flush coolant jacket", style={'color': THEME['text_secondary'], 'marginTop': '2px'})
                        ])
                    ]),

                    # Advisory Bubble 3
                    html.Div(style={'backgroundColor': '#08182b', 'border': f"1px solid rgba(6,182,212,0.4)", 'borderRadius': '8px 8px 8px 0px', 'padding': '10px'}, children=[
                        html.Div("⚡ ADVISORY 03 • 10:48 UTC", style={'color': THEME['cyan'], 'fontSize': '10px', 'fontWeight': 'bold', 'marginBottom': '4px'}),
                        html.P("Fuel flow variance suggests injector cleaning needed in next 50 hours.", style={'fontSize': '11px', 'color': THEME['text_primary'], 'margin': 0}),
                        html.Div(style={'backgroundColor': '#05101d', 'padding': '6px 8px', 'borderRadius': '4px', 'marginTop': '6px', 'fontSize': '10px', 'fontFamily': THEME['font_mono']}, children=[
                            html.Span("Confidence: 92% | TTF: 42.0h | Cost: $350 | Downtime: 1.2h", style={'color': THEME['amber']}),
                            html.Div("Action: Ultrasonic solvent bath & pulse-width calibration", style={'color': THEME['text_secondary'], 'marginTop': '2px'})
                        ])
                    ]),

                    # User Query Bubble (White design)
                    html.Div(style={'backgroundColor': '#ffffff', 'color': '#0f172a', 'borderRadius': '8px 8px 0px 8px', 'padding': '8px 12px', 'alignSelf': 'flex-end', 'maxWidth': '85%', 'fontSize': '11px', 'fontWeight': '500'}, children=[
                        "Engineer Query: Run multi-mission fleet wear projection for Rotax 914-F"
                    ])
                ]),

                # Chat Input Box
                html.Div(style={'display': 'flex', 'gap': '8px', 'marginTop': '12px', 'borderTop': f"1px solid {THEME['border']}", 'paddingTop': '10px'}, children=[
                    dcc.Input(placeholder="Type maintenance query (e.g. check oil pressure / bearing)...", style={'flex': 1, 'backgroundColor': THEME['bg_subtle'], 'border': f"1px solid {THEME['border']}", 'borderRadius': '4px', 'padding': '6px 10px', 'color': '#ffffff', 'fontSize': '11px'}),
                    dbc.Button("SEND", color="info", size="sm", style={'fontSize': '10px', 'fontWeight': 'bold'})
                ])
            ]), width=5),

            # FEATURE 2: Maintenance Priority Queue (Auto-Ranked Cards)
            dbc.Col(html.Div(style={'backgroundColor': THEME['bg_card'], 'border': f"1px solid {THEME['border']}", 'padding': '16px', 'borderRadius': '8px', 'height': '100%'}, children=[
                html.Div(style={'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center', 'marginBottom': '10px', 'borderBottom': f"1px solid {THEME['border']}", 'paddingBottom': '8px'}, children=[
                    html.Div([
                        html.Span("📋 MAINTENANCE PRIORITY QUEUE", style={'color': THEME['white'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                        html.Div("Ranking Formula: (Severity × Failure Probability) / Time Until Critical", style={'fontSize': '9px', 'color': THEME['cyan'], 'fontFamily': THEME['font_mono']})
                    ]),
                    html.Span("Red: 0-10h | Amber: 10-50h | Green: >50h", style={'fontSize': '10px', 'color': THEME['text_secondary']})
                ]),

                # Priority Cards
                html.Div(style={'display': 'flex', 'flexDirection': 'column', 'gap': '8px', 'maxHeight': '440px', 'overflowY': 'auto'}, children=[
                    # Card 1: Immediate (Red)
                    html.Div(style={'backgroundColor': 'rgba(244,63,94,0.12)', 'border': f"1px solid {THEME['rose']}", 'borderRadius': '6px', 'padding': '10px'}, children=[
                        html.Div(style={'display': 'flex', 'justifyContent': 'space-between'}, children=[
                            html.Span("#1 • Main Crankshaft Bearing #2", style={'color': THEME['white'], 'fontWeight': 'bold', 'fontSize': '12px'}),
                            html.Span("8.5h REMAINING (IMMEDIATE)", style={'color': THEME['rose'], 'fontWeight': 'bold', 'fontSize': '10px', 'fontFamily': THEME['font_mono']})
                        ]),
                        html.Div("Issue: Spalling fatigue & harmonic 2X vibration spike | Impact: CRITICAL READINESS", style={'fontSize': '10px', 'color': THEME['text_secondary'], 'margin': '2px 0'}),
                        html.Div("Action: Borescope inspection & ultrasonic journal probe (Score: 9.85)", style={'fontSize': '10px', 'color': THEME['cyan']})
                    ]),

                    # Card 2: Soon (Amber)
                    html.Div(style={'backgroundColor': 'rgba(245,158,11,0.1)', 'border': f"1px solid {THEME['amber']}", 'borderRadius': '6px', 'padding': '10px'}, children=[
                        html.Div(style={'display': 'flex', 'justifyContent': 'space-between'}, children=[
                            html.Span("#2 • Cylinder 2 High-Pressure Injector", style={'color': THEME['white'], 'fontWeight': 'bold', 'fontSize': '12px'}),
                            html.Span("14.2h REMAINING (SOON)", style={'color': THEME['amber'], 'fontWeight': 'bold', 'fontSize': '10px', 'fontFamily': THEME['font_mono']})
                        ]),
                        html.Div("Issue: Nozzle cavitation & thermal delta (+18°C) | Impact: MODERATE READINESS", style={'fontSize': '10px', 'color': THEME['text_secondary'], 'margin': '2px 0'}),
                        html.Div("Action: Ultrasonic solvent cleaning & seal kit replacement (Score: 4.16)", style={'fontSize': '10px', 'color': THEME['cyan']})
                    ]),

                    # Card 3: Soon (Amber)
                    html.Div(style={'backgroundColor': 'rgba(245,158,11,0.1)', 'border': f"1px solid {THEME['amber']}", 'borderRadius': '6px', 'padding': '10px'}, children=[
                        html.Div(style={'display': 'flex', 'justifyContent': 'space-between'}, children=[
                            html.Span("#3 • Coolant Pump Ceramic Seal", style={'color': THEME['white'], 'fontWeight': 'bold', 'fontSize': '12px'}),
                            html.Span("24.0h REMAINING (SOON)", style={'color': THEME['amber'], 'fontWeight': 'bold', 'fontSize': '10px', 'fontFamily': THEME['font_mono']})
                        ]),
                        html.Div("Issue: Thermal stress abrasion & slow weep | Impact: MODERATE READINESS", style={'fontSize': '10px', 'color': THEME['text_secondary'], 'margin': '2px 0'}),
                        html.Div("Action: Replace ceramic seal kit & flush cooling jacket (Score: 1.93)", style={'fontSize': '10px', 'color': THEME['cyan']})
                    ]),

                    # Card 4: Soon (Amber)
                    html.Div(style={'backgroundColor': 'rgba(245,158,11,0.1)', 'border': f"1px solid {THEME['amber']}", 'borderRadius': '6px', 'padding': '10px'}, children=[
                        html.Div(style={'display': 'flex', 'justifyContent': 'space-between'}, children=[
                            html.Span("#4 • Turbocharger Wastegate Linkage", style={'color': THEME['white'], 'fontWeight': 'bold', 'fontSize': '12px'}),
                            html.Span("38.0h REMAINING (SOON)", style={'color': THEME['amber'], 'fontWeight': 'bold', 'fontSize': '10px', 'fontFamily': THEME['font_mono']})
                        ]),
                        html.Div("Issue: High-temp pivot binding & boost lag | Impact: LOW READINESS", style={'fontSize': '10px', 'color': THEME['text_secondary'], 'margin': '2px 0'}),
                        html.Div("Action: Apply aero-grade antiseize & calibrate TCU stop (Score: 0.77)", style={'fontSize': '10px', 'color': THEME['cyan']})
                    ]),

                    # Card 5: Planned (Green)
                    html.Div(style={'backgroundColor': 'rgba(16,185,129,0.08)', 'border': f"1px solid {THEME['emerald']}", 'borderRadius': '6px', 'padding': '10px'}, children=[
                        html.Div(style={'display': 'flex', 'justifyContent': 'space-between'}, children=[
                            html.Span("#5 • Dual Spark Plug Array (x8)", style={'color': THEME['white'], 'fontWeight': 'bold', 'fontSize': '12px'}),
                            html.Span("72.0h REMAINING (PLANNED)", style={'color': THEME['emerald'], 'fontWeight': 'bold', 'fontSize': '10px', 'fontFamily': THEME['font_mono']})
                        ]),
                        html.Div("Issue: Standard electrode erosion (0.82mm) | Impact: LOW READINESS", style={'fontSize': '10px', 'color': THEME['text_secondary'], 'margin': '2px 0'}),
                        html.Div("Action: Re-gap electrodes or replace at 100h depot (Score: 0.17)", style={'fontSize': '10px', 'color': THEME['cyan']})
                    ])
                ])
            ]), width=7)
        ]),

        # Row 2: Feature 3 (Mission Impact Simulator & Gauges)
        html.Div(style={'backgroundColor': THEME['bg_card'], 'border': f"1px solid {THEME['border']}", 'padding': '16px', 'borderRadius': '8px'}, children=[
            html.Div(style={'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center', 'marginBottom': '12px', 'borderBottom': f"1px solid {THEME['border']}", 'paddingBottom': '8px'}, children=[
                html.Span("🔬 FEATURE 3: MISSION IMPACT SIMULATOR ['WHAT IF' SCENARIO]", style={'color': THEME['cyan'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                html.Span("Simulate Action Deferral vs Proactive Maintenance", style={'fontSize': '10px', 'color': THEME['text_secondary']})
            ]),

            dbc.Row([
                # Sliders & Action selector
                dbc.Col([
                    html.Label("Target Action: Main Crankshaft Bearing #2", style={'fontSize': '11px', 'fontWeight': 'bold', 'color': THEME['text_primary']}),
                    html.Div("Estimated Downtime: 2.5 hrs | Cost: $450 USD", style={'fontSize': '10px', 'color': THEME['emerald'], 'marginBottom': '10px'}),

                    html.Label("Deferral Flight Hours Horizon:", style={'fontSize': '11px', 'color': THEME['text_secondary']}),
                    dcc.Slider(min=0, max=40, step=5, value=15, marks={0: '0h (Now)', 15: '+15h Delay', 40: '+40h Critical'}, id='slider-deferral'),

                    html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '10px', 'borderRadius': '6px', 'marginTop': '16px', 'fontSize': '10px', 'fontFamily': THEME['font_mono'], 'lineHeight': '1.6'}, children=[
                        html.Div("● If Serviced Now: 98% Mission Readiness Restored", style={'color': THEME['emerald']}),
                        html.Div("● If Deferred +15h: Readiness degrades to 62% (Moderate Risk)", style={'color': THEME['amber']}),
                        html.Div("● Unserviced Breakdown Risk: Catastrophic fail-stop escalates cost to $3,850 USD", style={'color': THEME['rose']})
                    ])
                ], width=4),

                # Gauge Pair
                dbc.Col([
                    dcc.Graph(figure=fig_readiness_gauge, config={'displayModeBar': False})
                ], width=4),
                dbc.Col([
                    dcc.Graph(figure=fig_risk_gauge, config={'displayModeBar': False})
                ], width=4),
            ])
        ]),

        # Row 3: Feature 4 (Service History & Learning) + Feature 5 (Digital Twin Wear Divergence)
        dbc.Row([
            # Feature 4: Service History & Learning
            dbc.Col(html.Div(style={'backgroundColor': THEME['bg_card'], 'border': f"1px solid {THEME['border']}", 'padding': '16px', 'borderRadius': '8px'}, children=[
                html.Div(style={'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center', 'marginBottom': '10px', 'borderBottom': f"1px solid {THEME['border']}", 'paddingBottom': '8px'}, children=[
                    html.Span("📜 SERVICE HISTORY & MODEL LEARNING", style={'color': THEME['emerald'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    html.Span("Accuracy: 94.6%", style={'color': THEME['emerald'], 'fontSize': '11px', 'fontWeight': 'bold', 'fontFamily': THEME['font_mono']})
                ]),

                html.Div(style={'display': 'flex', 'flexDirection': 'column', 'gap': '8px', 'maxHeight': '220px', 'overflowY': 'auto'}, children=[
                    html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '8px', 'borderRadius': '4px', 'fontSize': '10px', 'fontFamily': THEME['font_mono']}, children=[
                        html.Div("MISSION-024 • Cylinder 1 Exhaust Valve (2026-09-18)", style={'fontWeight': 'bold', 'color': THEME['white']}),
                        html.Div("AI: Micro-leakage predicted | Ground Truth: Micro-leak confirmed on seat lap", style={'color': THEME['text_secondary']}),
                        html.Span("✔ ACCURATE PREDICTION (Technician: Sgt. V. Sharma)", style={'color': THEME['emerald']})
                    ]),
                    html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '8px', 'borderRadius': '4px', 'fontSize': '10px', 'fontFamily': THEME['font_mono']}, children=[
                        html.Div("MISSION-021 • Oil Pressure Sensor Harness (2026-09-10)", style={'fontWeight': 'bold', 'color': THEME['white']}),
                        html.Div("AI: Signal impedance drift predicted | Ground Truth: Loose pin re-crimped", style={'color': THEME['text_secondary']}),
                        html.Span("✔ ACCURATE PREDICTION (Technician: Tech. K. Nair)", style={'color': THEME['emerald']})
                    ]),
                    html.Div(style={'backgroundColor': THEME['bg_subtle'], 'padding': '8px', 'borderRadius': '4px', 'fontSize': '10px', 'fontFamily': THEME['font_mono']}, children=[
                        html.Div("MISSION-018 • Dual Spark Plug #4 (2026-08-28)", style={'fontWeight': 'bold', 'color': THEME['white']}),
                        html.Div("AI: Carbon fouling predicted | Ground Truth: Clean electrode (false positive)", style={'color': THEME['text_secondary']}),
                        html.Span("✖ FALSE ALARM (Model weights adjusted)", style={'color': THEME['rose']})
                    ])
                ])
            ]), width=6),

            # Feature 5: Integration with Digital Twin (Wear Divergence Monitor)
            dbc.Col(html.Div(style={'backgroundColor': THEME['bg_card'], 'border': f"1px solid {THEME['border']}", 'padding': '16px', 'borderRadius': '8px'}, children=[
                html.Div(style={'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center', 'marginBottom': '6px', 'borderBottom': f"1px solid {THEME['border']}", 'paddingBottom': '8px'}, children=[
                    html.Span("📈 DIGITAL TWIN WEAR DIVERGENCE MONITOR", style={'color': THEME['cyan'], 'fontSize': '12px', 'fontWeight': 'bold'}),
                    html.Span("DIVERGENCE > 8.5% : ENHANCED MONITORING ACTIVE", style={'backgroundColor': 'rgba(244,63,94,0.2)', 'border': f"1px solid {THEME['rose']}", 'color': THEME['rose'], 'fontSize': '9px', 'fontWeight': 'bold', 'padding': '2px 8px', 'borderRadius': '4px'})
                ]),
                dcc.Graph(figure=fig_wear, config={'displayModeBar': False})
            ]), width=6)
        ])
    ])

# ---------------------------------------------------------------------------
# 5. APP ROOT LAYOUT WITH NAVIGATION & MODAL CONTROLLERS
# ---------------------------------------------------------------------------


app.layout = html.Div(
    style={'backgroundColor': THEME['bg_app'], 'color': THEME['text_primary'], 'fontFamily': THEME['font_sans'], 'minHeight': '100vh'},
    children=[
        # Top Bar
        html.Header(style={'backgroundColor': '#070b13', 'borderBottom': f"1px solid {THEME['border']}", 'padding': '10px 24px', 'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center'}, children=[
            html.Div([
                html.Span("VIBESPAR", style={'fontFamily': THEME['font_mono'], 'fontWeight': '900', 'fontSize': '20px', 'color': THEME['cyan']}),
                html.Span(" DIGITAL TWIN GCS", style={'fontSize': '10px', 'color': THEME['text_secondary'], 'marginLeft': '6px'}),
            ]),
            dcc.RadioItems(
                id='role-selector',
                options=[
                    {'label': ' ✈ UAV OPERATOR ', 'value': 'OPERATOR'},
                    {'label': ' ⚙ PROPULSION ENGINEER ', 'value': 'ENGINEER'},
                    {'label': ' 🔧 MAINTENANCE TEAM ', 'value': 'MAINTENANCE'},
                    {'label': ' 📋 MISSION REPORTS ', 'value': 'REPORTS'},
                    {'label': ' ⚡ EDGE AI & SECURITY ', 'value': 'EDGE_AI'},
                ],
                value='EDGE_AI',
                inline=True,
                labelStyle={'display': 'inline-block', 'padding': '6px 14px', 'fontSize': '11px', 'fontWeight': 'bold', 'color': THEME['text_secondary'], 'cursor': 'pointer'},
            ),
            html.Div(id="hud-clock", style={'fontFamily': THEME['font_mono'], 'fontSize': '12px', 'color': THEME['cyan']}),
        ]),

        # State Stores
        dcc.Store(id='store-selected-mission', data='MISSION-027'),
        dcc.Store(id='store-active-report-section', data='summary'),
        dcc.Interval(id='sim-interval', interval=2000, n_intervals=0),

        # Main Content Container
        html.Main(id='main-role-container', style={'maxWidth': '1920px', 'margin': '0 auto', 'padding': '14px 20px'})
    ]
)

# ---------------------------------------------------------------------------
# 6. CALLBACKS
# ---------------------------------------------------------------------------
@app.callback(Output('hud-clock', 'children'), Input('sim-interval', 'n_intervals'))
def update_clock(n):
    return datetime.utcnow().strftime('%H:%M:%S UTC')

@app.callback(
    Output('main-role-container', 'children'),
    Input('role-selector', 'value'),
    Input('store-selected-mission', 'data'),
    Input('store-active-report-section', 'data')
)
def render_main_view(role, selected_mission, active_section):
    if role == 'REPORTS':
        if selected_mission:
            return render_individual_mission_report(selected_mission, active_section)
        return render_reports_dashboard()
    elif role == 'OPERATOR':
        return html.Div("Operator HUD view active. Select 'MISSION REPORTS' in top bar to view reports.", style={'padding': '20px', 'color': THEME['text_secondary']})
    elif role == 'ENGINEER':
        return html.Div("Propulsion Engineer bench active. Select 'MISSION REPORTS' in top bar to view reports.", style={'padding': '20px', 'color': THEME['text_secondary']})
    elif role == 'MAINTENANCE':
        return render_autonomous_maintenance_advisory_system()
    elif role == 'EDGE_AI':
        return render_edge_ai_and_security_panel()
    return html.Div("Select role.")

# Callback for section switching in individual report
@app.callback(
    Output('store-active-report-section', 'data'),
    Input('nav-sec-summary', 'n_clicks'),
    Input('nav-sec-health', 'n_clicks'),
    Input('nav-sec-devs', 'n_clicks'),
    Input('nav-sec-faults', 'n_clicks'),
    Input('nav-sec-eff', 'n_clicks'),
    Input('nav-sec-maint', 'n_clicks'),
    Input('nav-sec-twin', 'n_clicks'),
    prevent_initial_call=True
)
def switch_report_section(n_sum, n_hlth, n_dev, n_flt, n_eff, n_mnt, n_twn):
    ctx = callback_context
    if not ctx.triggered:
        return 'summary'
    btn_id = ctx.triggered[0]['prop_id'].split('.')[0]
    mapping = {
        'nav-sec-summary': 'summary',
        'nav-sec-health': 'healthTrend',
        'nav-sec-devs': 'deviations',
        'nav-sec-faults': 'faults',
        'nav-sec-eff': 'efficiency',
        'nav-sec-maint': 'maintenance',
        'nav-sec-twin': 'twinAccuracy',
    }
    return mapping.get(btn_id, 'summary')

# Callback for returning to All Missions dashboard
@app.callback(
    Output('store-selected-mission', 'data'),
    Input('btn-back-dashboard', 'n_clicks'),
    prevent_initial_call=True
)
def back_to_dashboard(n):
    return None

# Callback for selecting a mission from the dashboard table
@app.callback(
    Output('store-selected-mission', 'data', allow_duplicate=True),
    Input({'type': 'btn-view-mission', 'index': ALL}, 'n_clicks'),
    prevent_initial_call=True
)
def select_mission_from_table(n_clicks):
    ctx = callback_context
    if not ctx.triggered or not any(n_clicks or []):
        return dash.no_update
    trig = ctx.triggered[0]['prop_id']
    import json
    try:
        dict_part = trig.split('.')[0]
        val = json.loads(dict_part).get('index')
        return val
    except Exception:
        return 'MISSION-027'

# Callback for CSV Export
@app.callback(
    Output('download-mission-csv', 'data'),
    Input('btn-export-csv', 'n_clicks'),
    State('store-selected-mission', 'data'),
    prevent_initial_call=True
)
def export_mission_csv(n_clicks, mission_id):
    if not n_clicks:
        return dash.no_update
    m = next((item for item in PAST_MISSIONS if item['id'] == (mission_id or 'MISSION-027')), PAST_MISSIONS[0])
    csv_rows = [
        "Parameter,Value",
        f"Mission ID,{m['id']}",
        f"Date,{m['date']}",
        f"Duration,{m['duration']}",
        f"Max Altitude (ft),{m['alt']}",
        f"Distance (nm),{m['dist']}",
        f"Average Engine Health (%),{m['health']}",
        f"Peak CHT (C),{m['cht']}",
        f"Peak EGT (C),{m['egt']}",
        f"Fault Count,{m['faults']}",
        f"Sortie Status,{m['status']}",
        f"Sortie Grade,{m['grade']}",
        f"Pilot,{m['pilot']}",
        f"Airframe Tail,{m['tail']}",
        f"Synopsis,\"{m['summary']}\"",
        "Specific Air Range,5.79 NM/L",
        "Brake Specific Fuel Consumption,304 g/kWh",
        "Thermal Loss Attribution,58.4%",
        "Mechanical Loss Attribution,8.2%",
        "Pumping Loss Attribution,4.6%",
        "Digital Twin Fidelity,98.6%",
    ]
    return dict(content="\n".join(csv_rows), filename=f"{m['id']}_Propulsion_Health_Report.csv")

# Feedback for Share with Maintenance
@app.callback(
    Output('btn-share-report', 'children'),
    Input('btn-share-report', 'n_clicks'),
    prevent_initial_call=True
)
def share_with_maintenance(n_clicks):
    if n_clicks:
        return "✓ Dispatched to Maintenance Team"
    return "Share with Maintenance"

# Push OTA Model Update callback
@app.callback(
    Output('btn-py-push-ota', 'children'),
    Output('btn-py-push-ota', 'color'),
    Input('btn-py-push-ota', 'n_clicks'),
    prevent_initial_call=True
)
def push_ota_model(n_clicks):
    if n_clicks:
        return "✓ OTA Up-to-Date (v2.4.2)", "success"
    return "Push Model Update", "info"

if __name__ == '__main__':
    app.run_server(debug=True, port=8050)
