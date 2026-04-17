<template>
    <div class="dash">
    <div class="sidebar" :class="{ collapsed: collapsed }">
        <div class="brand-row">
            <button class="collapse-btn" @click="collapsed = !collapsed">
            <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            </button>
        <div class="brand-icon">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="7" height="7" rx="2" fill="#141414"/>
            <rect x="11" y="2" width="7" height="7" rx="2" fill="#141414"/>
            <rect x="2" y="11" width="7" height="7" rx="2" fill="#141414"/>
            <rect x="11" y="11" width="7" height="7" rx="2" fill="#333"/>
            </svg>
        </div>
        <div>
            <div class="brand-name">Cikgu Kereta</div>
            <div class="brand-sub">Workshop</div>
        </div>
        </div>

        <!-- Navigation -->
        <router-link
            v-for="item in menu"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            >
            <svg v-if="item.icon === 'grid'" class="nav-icon" viewBox="0 0 16 16">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/>
            </svg>

            <svg v-else-if="item.icon === 'list'" class="nav-icon" viewBox="0 0 16 16">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>

            <svg v-else-if="item.icon === 'user'" class="nav-icon" viewBox="0 0 16 16">
                <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.5"/>
            </svg>

            <svg v-else-if="item.icon === 'box'" class="nav-icon" viewBox="0 0 16 16">
                <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M5 6V4a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5"/>
            </svg>

            <svg v-else-if="item.icon === 'chart'" class="nav-icon" viewBox="0 0 16 16">
                <path d="M2 13l3-3 3 3 3-5 3 5" stroke="currentColor" stroke-width="1.5"/>
            </svg>

            <svg v-else-if="item.icon === 'alert'" class="nav-icon" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 5v3M8 11h.01" stroke="currentColor" stroke-width="1.5"/>
            </svg>

            <span v-if="!collapsed" class="nav-text">{{ item.name }}</span>
            </router-link>

        <div class="sidebar-foot">
        <div class="user-row">
            <div class="avatar">AB</div>
            <div>
            <div class="user-name">Ahmad Bakri</div>
            <div class="user-role">Workshop Admin</div>
            </div>
        </div>
        </div>
    </div>

    <div class="main app-bg">
        <div class="top-bar">
        <div>
            <div class="page-title">Good morning, Ahmad</div>
            <div class="page-date">Thursday, 16 April 2026 &nbsp;·&nbsp; <span style="display:inline-flex;align-items:center;gap:4px"><span class="status-dot"></span>Workshop is open</span></div>
        </div>
        <div class="top-right">
            <button class="pill-btn">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M6 3v3l2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            Today
            </button>
            <button class="pill-btn primary">+ New Job Order</button>
        </div>
        </div>

        <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-label">Today's revenue
            <div class="metric-icon mi-green">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10l3-3 3 3 3-5" stroke="#4CAF50" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            </div>
            <div class="metric-value">RM 2,850</div>
            <div class="metric-sub"><span class="metric-up">↑ 12%</span>&nbsp;vs yesterday</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Active jobs
            <div class="metric-icon mi-blue">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="#1565c0" stroke-width="1.2"/><path d="M1 6.5h12" stroke="#1565c0" stroke-width="1.2"/></svg>
            </div>
            </div>
            <div class="metric-value">7</div>
            <div class="metric-sub">3 completing today</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Pending invoices
            <div class="metric-icon mi-amber">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v4l2 2" stroke="#e57320" stroke-width="1.4" stroke-linecap="round"/><circle cx="7" cy="7" r="5.5" stroke="#e57320" stroke-width="1.2"/></svg>
            </div>
            </div>
            <div class="metric-value">RM 4,120</div>
            <div class="metric-sub">From 6 invoices</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Low stock alerts
            <div class="metric-icon mi-red">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L1.5 11h11L7 2z" stroke="#e53935" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 6v3M7 10.5h.01" stroke="#e53935" stroke-width="1.2" stroke-linecap="round"/></svg>
            </div>
            </div>
            <div class="metric-value">5</div>
            <div class="metric-sub"><span class="metric-down">2 critical</span></div>
        </div>
        </div>

        <div class="content-row-3">
        <div class="card">
            <div class="card-head">
            <span class="card-title">Today's job orders</span>
            <span class="card-link">View all</span>
            </div>
            <table class="jobs-table">
            <thead>
                <tr>
                <th>Customer / Plate</th>
                <th>Service</th>
                <th>Mechanic</th>
                <th>Est.</th>
                <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                <td><div class="job-customer">Hafiz Rahman</div><div class="job-plate">WPL 1234</div></td>
                <td>Engine service + oil</td>
                <td>Azri</td>
                <td>RM 320</td>
                <td><span class="status-pill sp-green">Completed</span></td>
                </tr>
                <tr>
                <td><div class="job-customer">Nurul Ain</div><div class="job-plate">VCG 8821</div></td>
                <td>Brake pad replacement</td>
                <td>Faizal</td>
                <td>RM 180</td>
                <td><span class="status-pill sp-blue">In progress</span></td>
                </tr>
                <tr>
                <td><div class="job-customer">Rizwan Othman</div><div class="job-plate">BJG 4410</div></td>
                <td>AC gas top-up</td>
                <td>Azri</td>
                <td>RM 150</td>
                <td><span class="status-pill sp-blue">In progress</span></td>
                </tr>
                <tr>
                <td><div class="job-customer">Siti Mariam</div><div class="job-plate">PBM 5599</div></td>
                <td>Tyre rotation + alignment</td>
                <td>Unassigned</td>
                <td>RM 220</td>
                <td><span class="status-pill sp-amber">Waiting</span></td>
                </tr>
                <tr>
                <td><div class="job-customer">Aiman Zulkifli</div><div class="job-plate">SAA 7732</div></td>
                <td>Full inspection</td>
                <td>Faizal</td>
                <td>RM 90</td>
                <td><span class="status-pill sp-gray">Pending</span></td>
                </tr>
            </tbody>
            </table>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
            <div class="card">
            <div class="card-head">
                <span class="card-title">Quick actions</span>
            </div>
            <div class="quick-actions">
                <div class="qa-btn">
                <div class="qa-icon" style="background:#f0faf0">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="#2e7d32" stroke-width="1.6" stroke-linecap="round"/></svg>
                </div>
                <div class="qa-label">New job order</div>
                <div class="qa-desc">Walk-in or booking</div>
                </div>
                <div class="qa-btn">
                <div class="qa-icon" style="background:#eef4ff">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="#1565c0" stroke-width="1.2"/><path d="M4 5h6M4 7.5h4" stroke="#1565c0" stroke-width="1.2" stroke-linecap="round"/></svg>
                </div>
                <div class="qa-label">Create invoice</div>
                <div class="qa-desc">From job or manual</div>
                </div>
                <div class="qa-btn">
                <div class="qa-icon" style="background:#fff8ee">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 11V5l6-3 6 3v6l-6 3-6-3z" stroke="#e57320" stroke-width="1.2" stroke-linejoin="round"/></svg>
                </div>
                <div class="qa-label">Add inventory</div>
                <div class="qa-desc">Parts & supplies</div>
                </div>
                <div class="qa-btn">
                <div class="qa-icon" style="background:#f5f0ff">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="4" r="2.5" stroke="#7c3aed" stroke-width="1.2"/><path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#7c3aed" stroke-width="1.2" stroke-linecap="round"/><path d="M10 6l1.5 1.5L14 5" stroke="#7c3aed" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div class="qa-label">Add customer</div>
                <div class="qa-desc">New registration</div>
                </div>
            </div>
            </div>

            <div class="card">
            <div class="card-head">
                <span class="card-title">Weekly revenue</span>
                <span class="card-link">RM 14,240 this week</span>
            </div>
            <div class="chart-bars">
                <div class="chart-bar-wrap"><div class="chart-bar" style="height:52px"></div><div class="chart-day">Mon</div></div>
                <div class="chart-bar-wrap"><div class="chart-bar" style="height:38px"></div><div class="chart-day">Tue</div></div>
                <div class="chart-bar-wrap"><div class="chart-bar" style="height:65px"></div><div class="chart-day">Wed</div></div>
                <div class="chart-bar-wrap"><div class="chart-bar" style="height:44px"></div><div class="chart-day">Thu</div></div>
                <div class="chart-bar-wrap"><div class="chart-bar" style="height:28px"></div><div class="chart-day">Fri</div></div>
                <div class="chart-bar-wrap"><div class="chart-bar" style="height:72px"></div><div class="chart-day">Sat</div></div>
                <div class="chart-bar-wrap"><div class="chart-bar today" style="height:48px"></div><div class="chart-day" style="color:#111;font-weight:500">Sun</div></div>
            </div>
            </div>
        </div>
        </div>

        <div class="content-row">
        <div class="card">
            <div class="card-head">
            <span class="card-title">Low stock alerts</span>
            <span class="card-link">View inventory</span>
            </div>
            <div class="stock-list">
            <div class="stock-item critical">
                <div>
                <div class="stock-name">Engine oil 5W-30 (1L)</div>
                <div class="stock-min">Min stock: 20 units</div>
                </div>
                <div style="text-align:right">
                <div class="stock-qty">3 left</div>
                <span class="stock-badge badge-crit">Critical</span>
                </div>
            </div>
            <div class="stock-item critical">
                <div>
                <div class="stock-name">Oil filter — Toyota Vios</div>
                <div class="stock-min">Min stock: 10 units</div>
                </div>
                <div style="text-align:right">
                <div class="stock-qty">2 left</div>
                <span class="stock-badge badge-crit">Critical</span>
                </div>
            </div>
            <div class="stock-item">
                <div>
                <div class="stock-name">Brake fluid DOT4 (500ml)</div>
                <div class="stock-min">Min stock: 15 units</div>
                </div>
                <div style="text-align:right">
                <div class="stock-qty">7 left</div>
                <span class="stock-badge badge-warn">Low</span>
                </div>
            </div>
            <div class="stock-item">
                <div>
                <div class="stock-name">AC refrigerant R134a</div>
                <div class="stock-min">Min stock: 8 units</div>
                </div>
                <div style="text-align:right">
                <div class="stock-qty">5 left</div>
                <span class="stock-badge badge-warn">Low</span>
                </div>
            </div>
            <div class="stock-item">
                <div>
                <div class="stock-name">Spark plugs (NGK)</div>
                <div class="stock-min">Min stock: 20 units</div>
                </div>
                <div style="text-align:right">
                <div class="stock-qty">9 left</div>
                <span class="stock-badge badge-warn">Low</span>
                </div>
            </div>
            </div>
        </div>

        <div class="card">
            <div class="card-head">
            <span class="card-title">Recent activity</span>
            <span class="card-link">See all</span>
            </div>
            <div class="activity-list">
            <div class="activity-item">
                <div class="act-dot-wrap">
                <div class="act-dot" style="background:#4CAF50"></div>
                <div class="act-line"></div>
                </div>
                <div>
                <div class="act-text"><span class="act-bold">Invoice #1041</span> marked as paid — <span class="act-bold">Hafiz Rahman</span></div>
                <div class="act-time">9:42 am</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="act-dot-wrap">
                <div class="act-dot" style="background:#1565c0"></div>
                <div class="act-line"></div>
                </div>
                <div>
                <div class="act-text">New job order created for <span class="act-bold">Siti Mariam</span> (WPL 5599)</div>
                <div class="act-time">9:15 am</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="act-dot-wrap">
                <div class="act-dot" style="background:#e57320"></div>
                <div class="act-line"></div>
                </div>
                <div>
                <div class="act-text"><span class="act-bold">Engine oil 5W-30</span> dropped below minimum stock</div>
                <div class="act-time">8:58 am</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="act-dot-wrap">
                <div class="act-dot" style="background:#888"></div>
                <div class="act-line"></div>
                </div>
                <div>
                <div class="act-text">Quotation sent to <span class="act-bold">Aiman Zulkifli</span> — RM 90</div>
                <div class="act-time">8:30 am</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="act-dot-wrap">
                <div class="act-dot" style="background:#4CAF50"></div>
                <div class="act-line"></div>
                </div>
                <div>
                <div class="act-text">Job order <span class="act-bold">#JO-2204</span> completed by Azri</div>
                <div class="act-time">Yesterday, 5:50 pm</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="act-dot-wrap">
                <div class="act-dot" style="background:#7c3aed"></div>
                <div class="act-line"></div>
                </div>
                <div>
                <div class="act-text">New customer registered — <span class="act-bold">Rizwan Othman</span></div>
                <div class="act-time">Yesterday, 4:12 pm</div>
                </div>
            </div>
            </div>
        </div>
        </div>

    </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            collapsed: false,
            menu: [
                { name: "Dashboard", path: "/dashboard", icon: "grid" },
                { name: "Transactions", path: "/transactions", icon: "list" },
                { name: "Customers", path: "/customers", icon: "user" },
                { name: "Inventory", path: "/inventory", icon: "box" },
                { name: "Report", path: "/report", icon: "chart" },
                { name: "Expense", path: "/expense", icon: "alert" }
            ]
        };
    }
};
</script>


<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  *{margin:0;padding:0}
  .dash{display:flex;height:100vh;font-family:'Inter',sans-serif;font-size:13px;color:#111;min-height:700px}
  .sidebar{width:220px;background:#141414;display:flex;flex-direction:column;padding:24px 18px;flex-shrink:0;gap:6px}
 
  .main{flex:1;background:#f9f9f8;overflow-y:auto;padding:28px 28px}
  .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
  .page-title{font-size:20px;font-weight:600;color:#111;letter-spacing:-0.4px}
  .page-date{font-size:12px;color:#999;margin-top:2px}
  .top-right{display:flex;align-items:center;gap:10px}


  .metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
  .metric-card{background:#fff;border:1px solid #e8e8e6;border-radius:12px;padding:16px 18px}
  .metric-label{font-size:11px;color:#999;font-weight:500;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
  .metric-value{font-size:22px;font-weight:600;color:#111;letter-spacing:-0.5px;line-height:1}
  .metric-sub{font-size:11px;color:#999;margin-top:6px;display:flex;align-items:center;gap:4px}

  .metric-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center}
  .mi-green{background:#f0faf0}
  .mi-blue{background:#eef4ff}
  .mi-amber{background:#fff8ee}
  .mi-red{background:#fff0f0}
  .content-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
  .content-row-3{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px}

  .quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .qa-btn{background:#f9f9f8;border:1px solid #e8e8e6;border-radius:10px;padding:14px 14px;cursor:pointer;transition:all 0.12s;text-align:left}
  .qa-btn:hover{background:#f0f0ee;border-color:#d8d8d4}
  .qa-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;margin-bottom:8px}
  .qa-label{font-size:12px;font-weight:500;color:#111}
  .qa-desc{font-size:11px;color:#999;margin-top:2px}
  .activity-list{display:flex;flex-direction:column;gap:0}
  .activity-item{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #f2f2f0}
  .activity-item:last-child{border-bottom:none}
  .act-dot-wrap{display:flex;flex-direction:column;align-items:center;padding-top:3px}
  .act-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
  .act-line{width:1px;height:100%;background:#f0f0ee;margin-top:4px;flex:1;min-height:16px}
  .activity-item:last-child .act-line{display:none}
  .act-text{font-size:12px;color:#555;line-height:1.5}
  .act-bold{font-weight:500;color:#111}
  .act-time{font-size:11px;color:#bbb;margin-top:2px}
  .stock-list{display:flex;flex-direction:column;gap:8px}
  .stock-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:#fff8f0;border:1px solid #ffe0c0}
  .stock-item.critical{background:#fff0f0;border-color:#ffcccc}
  .stock-name{font-size:12px;font-weight:500;color:#111;flex:1}
  .stock-qty{font-size:11px;color:#e57320;font-weight:600}
  .stock-item.critical .stock-qty{color:#e53935}
  .stock-min{font-size:10px;color:#bbb}
  .stock-badge{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:500}
  .badge-warn{background:#fff3e0;color:#e57320}
  .badge-crit{background:#ffebee;color:#e53935}
  .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
  .bar-label{font-size:11px;color:#999;width:70px;flex-shrink:0}
  .bar-track{flex:1;height:6px;background:#f2f2f0;border-radius:3px;overflow:hidden}
  .bar-fill{height:100%;border-radius:3px}
  .bar-val{font-size:11px;font-weight:500;color:#111;width:42px;text-align:right;flex-shrink:0}

  .job-customer{font-weight:500;color:#111;font-size:12px}
  .job-plate{font-size:11px;color:#999}

  .inv-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f8f8f6}
  .inv-row:last-child{border-bottom:none}
  .inv-label{font-size:12px;color:#555}
  .inv-val{font-size:12px;font-weight:500;color:#111}
  .chart-bars{display:flex;align-items:flex-end;gap:5px;height:80px;margin-top:8px}
  .chart-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
  .chart-bar{width:100%;border-radius:4px 4px 0 0;background:#e8e8e6;min-height:4px}
  .chart-bar.today{background:#141414}
  .chart-day{font-size:9px;color:#bbb}
  .divider{height:1px;background:#f2f2f0;margin:12px 0}


</style>
