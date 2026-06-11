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
            <div class="field">
              <label>Email address</label>
              <input
                v-model.trim="email"
                type="email"
                placeholder="name@workshop.com"
                autocomplete="email"
              />
            </div>

            <div class="field">
              <div class="field-row">
                <label>Password</label>
                <router-link to="/forgot-password" class="forgot">
                  Forgot password?
                </router-link>
              </div>

              <input
                v-model="password"
                type="password"
                placeholder="Enter your password"
                autocomplete="current-password"
              />
            </div>

            <button type="submit" :disabled="loading">
              {{ loading ? "Signing in..." : "Sign in" }}
            </button>
          </form>

          <p class="card-foot">
            No account?
            <router-link to="/register">Request access</router-link>
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
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.login-page {
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background: #fafaf8;
  position: relative;
  overflow: hidden;
  padding: 38px 56px;
}

.dot-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #d7d7d2 1px, transparent 1px);
  background-size: 22px 22px;
  opacity: 0.35;
  pointer-events: none;
}

/* TOP LOGO */
.topbar {
  position: relative;
  z-index: 1;
  height: 58px;
  display: flex;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 2px #e5e5e0;
}

.brand h1 {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.4px;
  line-height: 1.15;
}

.brand p {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

/* MAIN LAYOUT */
.login-layout {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 120px);
  display: grid;
  grid-template-columns: minmax(360px, 520px) minmax(420px, 1fr);
  gap: 64px;
  align-items: center;
  max-width: 1260px;
  margin: 0 auto;
  transform: translateY(-20px);
}

/* LEFT FORM SIDE */
.login-side {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.intro {
  text-align: center;
  margin-bottom: 24px;
  max-width: 420px;
}

.eyebrow {
  display: inline-flex;
  padding: 6px 12px;
  background: #eeeeeb;
  color: #777;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  margin-bottom: 18px;
}

.intro h2 {
  font-size: 34px;
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -1.4px;
  color: #111;
  margin-bottom: 16px;
}

.intro p {
  font-size: 14px;
  color: #666;
  line-height: 1.65;
  max-width: 470px;
  margin: 0 auto;
}

/* LOGIN CARD */
.card {
  width: min(400px, 100%);
  background: #fff;
  border: 1px solid #e7e7e2;
  border-radius: 22px;
  padding: 30px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 12px;
  background: #eef7e9;
  border: 1px solid #d8ebcd;
  color: #2f6b1f;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 22px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #4caf50;
  border-radius: 50%;
}

.field {
  margin-bottom: 16px;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
}

.field label,
.field-row label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

.field-row label {
  margin-bottom: 0;
}

.forgot {
  font-size: 12px;
  color: #777;
  text-decoration: none;
  font-weight: 500;
}

.forgot:hover {
  color: #111;
  text-decoration: underline;
}

.field input {
  width: 100%;
  height: 44px;
  background: #fafaf9;
  border: 1px solid #dededa;
  border-radius: 10px;
  padding: 0 13px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: #111;
  outline: none;
  transition: all 0.15s ease;
}

.field input:focus {
  border-color: #111;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.06);
}

.field input::placeholder {
  color: #bfbfbc;
}

button {
  width: 100%;
  height: 46px;
  background: #111;
  border: none;
  border-radius: 10px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  margin-top: 4px;
  transition: all 0.15s ease;
}

button:hover {
  background: #222;
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.card-foot {
  margin-top: 17px;
  text-align: center;
  font-size: 13px;
  color: #888;
}

.card-foot a {
  color: #111;
  font-weight: 700;
  text-decoration: none;
}

.card-foot a:hover {
  text-decoration: underline;
}

.error {
  margin-top: 14px;
  text-align: center;
  font-size: 12px;
  line-height: 1.45;
  color: #e53935;
  background: #fff1f1;
  border: 1px solid #ffd6d6;
  border-radius: 10px;
  padding: 10px 12px;
}

/* MODULE CHIPS */
.module-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
  max-width: 420px;
}

.module-chips span {
  padding: 7px 11px;
  background: #fff;
  border: 1px solid #e6e6e2;
  border-radius: 999px;
  font-size: 12px;
  color: #555;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

/* RIGHT IMAGE SIDE */
.preview-side {
  position: relative;
  height: min(68vh, 620px);
  min-height: 500px;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid #e4e4df;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.1);
  background: #e9e6df;
}

/* right side preview */

.preview-side {
  height: min(72vh, 680px);
  min-height: 520px;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid #e4e4df;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.1);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 30%),
    linear-gradient(135deg, #171717, #242424);
  padding: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-card {
  width: 100%;
  max-width: 620px;
  background: rgba(250, 250, 248, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.25);
}

.preview-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.preview-label {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
  font-weight: 700;
  margin-bottom: 5px;
}

.preview-topbar h3 {
  font-size: 24px;
  color: #111;
  letter-spacing: -0.7px;
  margin: 0;
}

.preview-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #eef7e9;
  color: #2f6b1f;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.preview-status span {
  width: 6px;
  height: 6px;
  background: #4caf50;
  border-radius: 50%;
}

.preview-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.preview-kpi {
  background: #fff;
  border: 1px solid #e8e8e4;
  border-radius: 16px;
  padding: 14px;
}

.preview-kpi span {
  display: block;
  font-size: 10px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
  font-weight: 700;
}

.preview-kpi strong {
  font-size: 22px;
  color: #111;
  letter-spacing: -0.7px;
}

.preview-main {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 14px;
}

.preview-panel {
  background: #fff;
  border: 1px solid #e8e8e4;
  border-radius: 18px;
  padding: 16px;
}

.preview-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.preview-panel-head span {
  font-size: 13px;
  font-weight: 700;
  color: #111;
}

.preview-panel-head small {
  font-size: 11px;
  color: #aaa;
}

.activity-line {
  display: flex;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid #f0f0ed;
}

.activity-line:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.activity-dot.green {
  background: #34a853;
}

.activity-dot.blue {
  background: #2f80ed;
}

.activity-dot.orange {
  background: #f2994a;
}

.activity-line strong {
  font-size: 12px;
  color: #222;
}

.activity-line p {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.quick-grid {
  display: grid;
  gap: 9px;
}

.quick-grid div {
  padding: 11px;
  background: #fafaf9;
  border: 1px solid #eeeeea;
  border-radius: 12px;
  font-size: 11px;
  color: #555;
  font-weight: 600;
}

.preview-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.preview-footer span {
  padding: 7px 10px;
  background: #f3f3f0;
  border: 1px solid #e8e8e4;
  border-radius: 999px;
  font-size: 11px;
  color: #666;
  font-weight: 600;
}

/* RESPONSIVE */
@media (max-width: 1050px) {
  .login-page {
    padding: 28px;
  }

  .login-layout {
    grid-template-columns: 1fr;
    gap: 32px;
    max-width: 520px;
  }

  .intro h2 {
    font-size: 38px;
  }

  .preview-side {
    display: none;
  }
}

@media (max-width: 560px) {
  .login-page {
    padding: 22px 16px;
  }

  .topbar {
    height: auto;
    margin-bottom: 32px;
  }

  .intro h2 {
    font-size: 32px;
    letter-spacing: -1.2px;
  }

  .intro p {
    font-size: 14px;
  }

  .card {
    padding: 24px;
    border-radius: 18px;
  }
}
</style>