<template>
  <div class="container">
    <aside class="left">
      <div class="brand">
        <img src="../assets/vulcan_bg.png" class="brand-logo" />
        <div>
          <h1>Vulcan Auto Service</h1>
          <p class="brand-sub">Workshop Management</p>
        </div>
      </div>

      <div class="feature-block">
        <div class="feature-label">Workspace modules</div>

        <div class="feature-list">
          <div class="feat"><span class="feat-dot"></span>Customer & vehicle records</div>
          <div class="feat"><span class="feat-dot"></span>Inventory and stock alerts</div>
          <div class="feat"><span class="feat-dot"></span>Quotation, invoice & receipt</div>
          <div class="feat"><span class="feat-dot"></span>Payments and expenses</div>
          <div class="feat"><span class="feat-dot"></span>Reports and online requests</div>
        </div>
      </div>

      <div class="left-foot">
        <div class="left-foot-title">Secure internal access</div>
        <div class="left-foot-text">
          Staff can access workshop operations using assigned accounts based on their role.
        </div>
      </div>
    </aside>

    <main class="right">
      <div class="dot-bg"></div>
      <div class="soft-glow glow-one"></div>
      <div class="soft-glow glow-two"></div>

      <div class="login-shell">
        <section class="intro-card">
          <span class="intro-pill">Daily operations platform</span>

          <h2>Manage workshop service flow in one workspace.</h2>

          <p>
            Track customers, vehicles, inventory, transactions, online requests,
            payments, expenses, and reports from a centralized system.
          </p>

          <div class="intro-grid">
            <div class="intro-stat">
              <span class="stat-value">2</span>
              <span class="stat-label">Branches</span>
            </div>

            <div class="intro-stat">
              <span class="stat-value">14</span>
              <span class="stat-label">Core use cases</span>
            </div>
          </div>

          <div class="check-list">
            <div class="check-item">
              <span>✓</span>
              <p>Create quotations, invoices, and receipts.</p>
            </div>
            <div class="check-item">
              <span>✓</span>
              <p>Monitor low stock and service requests.</p>
            </div>
            <div class="check-item">
              <span>✓</span>
              <p>Generate reports for workshop decisions.</p>
            </div>
          </div>
        </section>

        <section class="card">
          <span class="card-pill">Internal access only</span>

          <h2>Sign in to your workspace</h2>
          <p class="card-sub">Workshop management system</p>

          <div class="status-bar">
            <span class="status-dot"></span>
            <span class="status-txt">All systems operational</span>
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
        </section>
      </div>
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

.container {
  display: flex;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background: #f9f9f8;
}

/* ── Left panel ── */
.left {
  width: 300px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 40%),
    #141414;
  display: flex;
  flex-direction: column;
  padding: 36px 30px;
  flex-shrink: 0;
  gap: 34px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow:
    0 0 0 2px #2a2a2a,
    0 14px 34px rgba(0, 0, 0, 0.35);
}

.left h1 {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.35px;
  line-height: 1.2;
}

.brand-sub {
  font-size: 11px;
  color: #777;
  margin-top: 3px;
}

.feature-block {
  flex: 1;
  border-top: 1px solid #232323;
  padding-top: 26px;
}

.feature-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
  margin-bottom: 16px;
  font-weight: 700;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feat {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #c6c6c6;
  line-height: 1.45;
}

.feat-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4b4b4b;
  flex-shrink: 0;
}

.left-foot {
  padding-top: 22px;
  border-top: 1px solid #232323;
}

.left-foot-title {
  font-size: 11px;
  font-weight: 700;
  color: #b5b5b5;
  margin-bottom: 7px;
}

.left-foot-text {
  font-size: 11px;
  color: #666;
  line-height: 1.65;
}

/* ── Right panel ── */
.right {
  flex: 1;
  background: #f9f9f8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 48px;
}

.dot-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #d1d1ce 1px, transparent 1px);
  background-size: 22px 22px;
  opacity: 0.45;
  pointer-events: none;
}

.soft-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.5;
  pointer-events: none;
}

.glow-one {
  width: 260px;
  height: 260px;
  top: 12%;
  right: 12%;
  background: rgba(0, 0, 0, 0.045);
}

.glow-two {
  width: 220px;
  height: 220px;
  bottom: 12%;
  left: 18%;
  background: rgba(0, 0, 0, 0.035);
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(940px, 100%);
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 28px;
  align-items: center;
}

/* ── Intro card ── */
.intro-card {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid #e8e8e5;
  border-radius: 22px;
  padding: 34px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
}

.intro-pill {
  display: inline-flex;
  background: #f0f0ee;
  border-radius: 999px;
  padding: 6px 11px;
  font-size: 10px;
  color: #777;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 18px;
}

.intro-card h2 {
  max-width: 430px;
  font-size: 34px;
  font-weight: 700;
  color: #111;
  line-height: 1.08;
  letter-spacing: -1.3px;
  margin-bottom: 14px;
}

.intro-card p {
  max-width: 470px;
  font-size: 13px;
  color: #737373;
  line-height: 1.75;
}

.intro-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 150px));
  gap: 12px;
  margin-top: 26px;
  margin-bottom: 24px;
}

.intro-stat {
  padding: 16px;
  background: #fafaf9;
  border: 1px solid #ececea;
  border-radius: 14px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.6px;
}

.stat-label {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: #888;
}

.check-list {
  display: grid;
  gap: 11px;
  padding-top: 20px;
  border-top: 1px solid #eeeeeb;
}

.check-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.check-item span {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #111;
  color: #fff;
  font-size: 11px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.check-item p {
  font-size: 12px;
  color: #555;
  line-height: 1.55;
}

/* ── Login card ── */
.card {
  position: relative;
  background: #fff;
  border: 1px solid #e8e8e6;
  border-radius: 22px;
  width: 100%;
  padding: 34px 32px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.07);
}

.card-pill {
  display: inline-block;
  background: #f0f0ee;
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 11px;
  color: #888;
  font-weight: 600;
  margin-bottom: 15px;
}

.card h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.7px;
  line-height: 1.18;
  margin-bottom: 5px;
}

.card-sub {
  font-size: 13px;
  color: #999;
  margin-bottom: 22px;
}

/* ── Status bar ── */
.status-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 22px;
  padding: 10px 12px;
  background: #f4f4f2;
  border-radius: 10px;
  border: 1px solid #eaeae8;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4caf50;
  flex-shrink: 0;
}

.status-txt {
  font-size: 11px;
  color: #888;
}

/* ── Form fields ── */
.field {
  margin-bottom: 15px;
}

.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 7px;
}

.field-row label,
.field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 7px;
}

.field-row label {
  margin-bottom: 0;
}

.forgot {
  font-size: 11px;
  color: #999;
  text-decoration: none;
}

.forgot:hover {
  color: #111;
}

.field input {
  width: 100%;
  background: #fafaf9;
  border: 1px solid #e4e4e2;
  border-radius: 10px;
  padding: 11px 12px;
  font-family: "Inter", sans-serif;
  font-size: 13px;
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
  color: #c9c9c7;
}

/* ── Button ── */
button {
  width: 100%;
  padding: 12px;
  background: #111;
  border: none;
  border-radius: 10px;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  margin-top: 6px;
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

/* ── Footer ── */
.card-foot {
  text-align: center;
  margin-top: 17px;
  font-size: 12px;
  color: #aaa;
}

.card-foot a {
  color: #111;
  text-decoration: none;
  font-weight: 600;
}

.card-foot a:hover {
  text-decoration: underline;
}

/* ── Error ── */
.error {
  margin-top: 13px;
  text-align: center;
  font-size: 12px;
  color: #e53935;
  background: #fff1f1;
  border: 1px solid #ffd6d6;
  border-radius: 10px;
  padding: 10px 12px;
  line-height: 1.45;
}

/* ── Responsive ── */
@media (max-width: 1050px) {
  .login-shell {
    grid-template-columns: 1fr;
    max-width: 420px;
  }

  .intro-card {
    display: none;
  }

  .right {
    padding: 32px;
  }
}

@media (max-width: 760px) {
  .container {
    flex-direction: column;
  }

  .left {
    width: 100%;
    min-height: auto;
    padding: 22px;
    gap: 18px;
  }

  .feature-block,
  .left-foot {
    display: none;
  }

  .right {
    min-height: calc(100vh - 94px);
    padding: 24px;
  }

  .card {
    padding: 30px 24px;
    border-radius: 18px;
  }
}
</style>