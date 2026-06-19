<template>
  <div class="login-page">
    <div class="dot-bg"></div>

    <header class="topbar">
      <div class="brand">
        <img src="../assets/vulcan_bg.png" class="brand-logo" />
        <div>
          <h1>Vulcan Auto Service</h1>
          <p>Workshop Management</p>
        </div>
      </div>
    </header>

    <main class="login-layout">
      <section class="login-side">
        <div class="intro">
          <span class="eyebrow">Internal workspace</span>
          <h2>Vulcan Auto Service Portal</h2>
          <p>
            Sign in with your assigned Admin or Staff account to manage workshop
            records, transactions, inventory, payments, expenses, and reports.
          </p>
        </div>

        <div class="card">
          <div class="status-bar">
            <span class="status-dot"></span>
            <span>All systems operational</span>
          </div>

          <form @submit.prevent="login">
            <div class="form-field">
              <label>Email address</label>
              <input
                v-model.trim="email"
                type="email"
                placeholder="name@workshop.com"
                autocomplete="email"
              />
            </div>

            <div class="form-field">
              <div class="form-field-row">
                <label>Password</label>

                <button
                  type="button"
                  class="forgot fake-link"
                  @click="forgotNotice = true; accessNotice = false"
                >
                  Forgot password?
                </button>

              </div>

              <input
                v-model="password"
                type="password"
                placeholder="Enter your password"
                autocomplete="current-password"
              />

              <p v-if="forgotNotice" class="helper-notice">
                Please contact the workshop admin to reset your password.
              </p>
            </div>

            <button type="submit" :disabled="loading">
              {{ loading ? "Signing in..." : "Sign in" }}
            </button>
          </form>

          <div class="card-foot">
            No account?
            <!--<router-link to="/register">Request access</router-link>-->
            <button
              type="button"
              class="request-link fake-link"
              @click="accessNotice = true; forgotNotice = false"
            >
              Request access
            </button>
          </div>

          <p v-if="accessNotice" class="helper-notice access-notice">
            Please contact the workshop admin to request an account.
          </p>

          <p v-if="error" class="error">{{ error }}</p>
        </div>

      </section>

      <section class="preview-side">
  <div class="preview-card">
    <div class="preview-topbar">
      <div>
        <span class="preview-label">System Preview</span>
        <h3>Workshop Dashboard</h3>
      </div>

      <span class="preview-status">
        <span></span>
        Live
      </span>
    </div>

    <div class="preview-kpis">
      <div class="preview-kpi">
        <span>Today’s Revenue</span>
        <strong>RM 0.00</strong>
      </div>

      <div class="preview-kpi">
        <span>Active Invoices</span>
        <strong>6</strong>
      </div>

      <div class="preview-kpi">
        <span>Low Stock</span>
        <strong>3</strong>
      </div>
    </div>

    <div class="preview-main">
      <div class="preview-panel large">
        <div class="preview-panel-head">
          <span>Recent Activity</span>
          <small>Updated now</small>
        </div>

        <div class="activity-line">
          <span class="activity-dot green"></span>
          <div>
            <strong>Payment recorded</strong>
            <p>Invoice marked as paid</p>
          </div>
        </div>

        <div class="activity-line">
          <span class="activity-dot blue"></span>
          <div>
            <strong>Quotation converted</strong>
            <p>New invoice generated</p>
          </div>
        </div>

        <div class="activity-line">
          <span class="activity-dot orange"></span>
          <div>
            <strong>Low stock alert</strong>
            <p>Inventory requires attention</p>
          </div>
        </div>
      </div>

      <div class="preview-panel small">
        <div class="preview-panel-head">
          <span>Quick Actions</span>
        </div>

        <div class="quick-grid">
          <div>New transaction</div>
          <div>Add part</div>
          <div>Import request</div>
          <div>Report</div>
        </div>
      </div>
    </div>

    <div class="preview-footer">
      <span>Customers</span>
      <span>Inventory</span>
      <span>Invoices</span>
      <span>Reports</span>
    </div>
  </div>
</section>
    </main>
  </div>
</template>

<script>
import api from "../services/api";

export default {
  data() {
    return {
      email: "",
      password: "",
      error: "",
      loading: false,
      forgotNotice: false,
      accessNotice: false,
    };
  },
  methods: {
    async login() {
      this.error = "";
      this.loading = true;

      try {
        const res = await api.post("/login", {
          email: this.email,
          password: this.password,
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        this.$router.push("/dashboard");
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          "Unable to sign in. Please check your credentials.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

* {
  box-sizing: border-box;
}

.login-page {
  --navy: #111827;
  --navy-soft: #172033;
  --text: #111827;
  --text-soft: #64748b;
  --muted: #94a3b8;
  --border: #dfe5ee;
  --surface: #ffffff;
  --page-bg: #f5f7fb;

  position: relative;
  min-height: 100vh;
  padding: 28px 44px 36px;
  overflow: hidden;

  color: var(--text);
  background:
    radial-gradient(circle at 14% 12%, rgba(148, 163, 184, 0.09), transparent 25%),
    radial-gradient(circle at 90% 82%, rgba(148, 163, 184, 0.08), transparent 28%),
    var(--page-bg);

  font-family: "Inter", sans-serif;
}

.dot-bg {
  position: absolute;
  inset: 0;
  opacity: 0.32;
  pointer-events: none;

  background-image: radial-gradient(
    circle,
    rgba(148, 163, 184, 0.38) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}

/* =========================================================
   BRAND
========================================================= */

.topbar {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;

  height: 64px;
  max-width: 1320px;
  margin: 0 auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.brand-logo {
  width: 38px;
  height: 38px;
  flex-shrink: 0;

  object-fit: contain;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid var(--border);

  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.1);
}

.brand h1 {
  margin: 0;

  color: var(--navy);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.035em;
}

.brand p {
  margin: 3px 0 0;

  color: #8a94a6;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.15;
  font-style: italic;
}

/* =========================================================
   MAIN LAYOUT
========================================================= */

.login-layout {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: minmax(360px, 470px) minmax(500px, 1fr);
  align-items: center;
  gap: 68px;

  width: 100%;
  max-width: 1260px;
  min-height: calc(100vh - 128px);
  margin: 0 auto;
}

.login-side {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* =========================================================
   INTRODUCTION
========================================================= */

.intro {
  width: 100%;
  max-width: 430px;
  margin-bottom: 24px;
  text-align: center;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 26px;
  margin-bottom: 16px;
  padding: 5px 11px;

  color: #64748b;
  background: #eef2f7;
  border: 1px solid #e2e8f0;
  border-radius: 999px;

  font-size: 9.5px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.intro h2 {
  margin: 0 0 12px;

  color: var(--navy);
  font-size: 31px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.045em;
}

.intro p {
  max-width: 420px;
  margin: 0 auto;

  color: #718096;
  font-size: 12.5px;
  line-height: 1.65;
}

/* =========================================================
   LOGIN CARD
========================================================= */

.card {
  width: min(390px, 100%);
  padding: 26px;

  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--border);
  border-radius: 18px;

  box-shadow:
    0 22px 55px rgba(15, 23, 42, 0.1),
    0 4px 12px rgba(15, 23, 42, 0.035);
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  min-height: 34px;
  margin-bottom: 20px;
  padding: 8px 12px;

  color: #287a49;
  background: #edf9f1;
  border: 1px solid #cfead8;
  border-radius: 10px;

  font-size: 10.5px;
  font-weight: 700;
}

.status-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;

  background: #31a665;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(49, 166, 101, 0.1);
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.form-field label {
  color: #475569;
  font-size: 11.5px;
  font-weight: 700;
}

.form-field input {
  width: 100%;
  height: 42px;
  padding: 0 13px;

  color: var(--text);
  background: #f8fafc;
  border: 1px solid #dbe2eb;
  border-radius: 10px;
  outline: none;

  font-family: inherit;
  font-size: 12.5px;

  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.form-field input::placeholder {
  color: #a8b2c1;
}

.form-field input:hover {
  border-color: #c9d2df;
}

.form-field input:focus {
  background: #ffffff;
  border-color: #aeb9c8;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.055);
}

/* Primary submit only */
form > button[type="submit"] {
  width: 100%;
  height: 42px;
  margin-top: 2px;

  color: #ffffff;
  background: var(--navy);
  border: 1px solid var(--navy);
  border-radius: 10px;

  font-family: inherit;
  font-size: 12.5px;
  font-weight: 750;

  cursor: pointer;

  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);

  transition:
    background-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

form > button[type="submit"]:hover:not(:disabled) {
  background: #1d293d;
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.2);
}

form > button[type="submit"]:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

form > button[type="submit"]:disabled {
  opacity: 0.62;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* =========================================================
   LINK-STYLE BUTTONS
========================================================= */

.fake-link {
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;

  color: inherit;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;

  font: inherit;
  cursor: pointer;

  transform: none;
}

.fake-link:hover {
  background: transparent;
  box-shadow: none;
  transform: none;
  text-decoration: underline;
}

.forgot {
  color: #718096;
  font-size: 10.5px;
  font-weight: 600;
}

.forgot:hover {
  color: var(--navy);
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  margin-top: 16px;

  color: #8a94a6;
  font-size: 11.5px;
  text-align: center;
}

.request-link {
  color: var(--navy);
  font-size: 11.5px;
  font-weight: 750;
}

.request-link:hover {
  color: var(--navy);
}

/* =========================================================
   MESSAGES
========================================================= */

.helper-notice {
  margin: 1px 0 0;
  padding: 9px 10px;

  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 9px;

  font-size: 10.5px;
  line-height: 1.45;
  text-align: left;
}

.access-notice {
  margin-top: 10px;
  text-align: center;
}

.error {
  margin: 12px 0 0;
  padding: 9px 11px;

  color: #b42318;
  background: #fff4f2;
  border: 1px solid #f6c7c1;
  border-radius: 9px;

  font-size: 10.5px;
  line-height: 1.45;
  text-align: center;
}

/* =========================================================
   SYSTEM PREVIEW
========================================================= */

.preview-side {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  height: min(70vh, 650px);
  min-height: 500px;
  padding: 34px;
  overflow: hidden;

  background:
    radial-gradient(
      circle at 82% 18%,
      rgba(148, 163, 184, 0.18),
      transparent 32%
    ),
    linear-gradient(145deg, #111827 0%, #172033 55%, #253247 100%);

  border: 1px solid rgba(15, 23, 42, 0.35);
  border-radius: 24px;

  box-shadow:
    0 28px 70px rgba(15, 23, 42, 0.2),
    0 8px 24px rgba(15, 23, 42, 0.1);
}

.preview-side::before {
  position: absolute;
  inset: 0;

  content: "";
  opacity: 0.16;
  pointer-events: none;

  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.55) 1px,
    transparent 1px
  );
  background-size: 22px 22px;
}

.preview-card {
  position: relative;
  z-index: 1;

  width: 100%;
  max-width: 610px;
  padding: 22px;

  background: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 20px;

  box-shadow:
    0 26px 60px rgba(0, 0, 0, 0.28),
    0 4px 14px rgba(0, 0, 0, 0.12);
}

.preview-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  margin-bottom: 18px;
}

.preview-label {
  display: block;
  margin-bottom: 5px;

  color: #94a3b8;
  font-size: 8.5px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.preview-topbar h3 {
  margin: 0;

  color: var(--navy);
  font-size: 21px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.preview-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  min-height: 25px;
  padding: 5px 9px;

  color: #287a49;
  background: #edf9f1;
  border: 1px solid #cfead8;
  border-radius: 999px;

  font-size: 9px;
  font-weight: 750;
}

.preview-status span {
  width: 5px;
  height: 5px;

  background: #31a665;
  border-radius: 50%;
}

.preview-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  margin-bottom: 12px;
}

.preview-kpi {
  min-width: 0;
  padding: 12px;

  background: #ffffff;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
}

.preview-kpi span {
  display: block;
  margin-bottom: 7px;

  color: #94a3b8;
  font-size: 8px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0.065em;
  text-transform: uppercase;
}

.preview-kpi strong {
  display: block;

  color: var(--navy);
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.035em;
}

.preview-main {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(150px, 0.75fr);
  gap: 12px;
}

.preview-panel {
  min-width: 0;
  padding: 14px;

  background: #ffffff;
  border: 1px solid #e1e7ef;
  border-radius: 13px;
}

.preview-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  margin-bottom: 10px;
}

.preview-panel-head span {
  color: var(--navy);
  font-size: 11px;
  font-weight: 800;
}

.preview-panel-head small {
  color: #9aa5b5;
  font-size: 8.5px;
}

.activity-line {
  display: flex;
  align-items: flex-start;
  gap: 9px;

  padding: 9px 0;
  border-bottom: 1px solid #edf1f6;
}

.activity-line:last-child {
  border-bottom: 0;
}

.activity-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;

  margin-top: 4px;
  border-radius: 999px;
}

.activity-dot.green {
  background: #31a665;
}

.activity-dot.blue {
  background: #3b82f6;
}

.activity-dot.orange {
  background: #f59e0b;
}

.activity-line strong {
  display: block;

  color: #334155;
  font-size: 9.5px;
  font-weight: 750;
  line-height: 1.3;
}

.activity-line p {
  margin: 2px 0 0;

  color: #94a3b8;
  font-size: 8.5px;
  line-height: 1.35;
}

.quick-grid {
  display: grid;
  gap: 7px;
}

.quick-grid div {
  padding: 9px 10px;

  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e3e8ef;
  border-radius: 9px;

  font-size: 9px;
  font-weight: 650;
}

.quick-grid div:first-child {
  color: #ffffff;
  background: var(--navy);
  border-color: var(--navy);
}

.preview-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;

  margin-top: 12px;
}

.preview-footer span {
  padding: 6px 9px;

  color: #64748b;
  background: #ffffff;
  border: 1px solid #e1e7ef;
  border-radius: 999px;

  font-size: 8.5px;
  font-weight: 650;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1080px) {
  .login-page {
    padding: 24px 28px 32px;
  }

  .login-layout {
    grid-template-columns: minmax(340px, 430px) minmax(430px, 1fr);
    gap: 38px;
  }

  .preview-side {
    padding: 24px;
  }
}

@media (max-width: 900px) {
  .login-page {
    min-height: 100vh;
    overflow-y: auto;
  }

  .topbar {
    max-width: 480px;
  }

  .login-layout {
    display: block;

    max-width: 480px;
    min-height: auto;
    padding: 48px 0 60px;
  }

  .preview-side {
    display: none;
  }
}

@media (max-width: 560px) {
  .login-page {
    padding: 18px 16px 28px;
  }

  .topbar {
    height: 54px;
  }

  .brand-logo {
    width: 34px;
    height: 34px;
  }

  .brand h1 {
    font-size: 14px;
  }

  .login-layout {
    padding-top: 38px;
  }

  .intro {
    margin-bottom: 20px;
  }

  .intro h2 {
    font-size: 27px;
  }

  .intro p {
    font-size: 12px;
  }

  .card {
    padding: 21px;
    border-radius: 15px;
  }
}
</style>