<template>
  <div class="container">
    <div class="left">
      <div class="brand">
        <img src="../assets/vulcan_bg.png" class="brand-logo" />
        <div>
          <h1>Vulcan Auto Service</h1>
          <p class="brand-sub">Workshop Management</p>
        </div>
      </div>

      <div class="feature-block">
        <div class="feature-label">What you can manage</div>
        <div class="feature-list">
          <div class="feat"><span class="feat-dot"></span>Customer management</div>
          <div class="feat"><span class="feat-dot"></span>Inventory control</div>
          <div class="feat"><span class="feat-dot"></span>Quotation &amp; invoicing</div>
          <div class="feat"><span class="feat-dot"></span>Expense tracking</div>
          <div class="feat"><span class="feat-dot"></span>Reports &amp; receipts</div>
        </div>
      </div>

      <div class="left-foot">
        <div class="left-foot-title">Secure internal access</div>
        <div class="left-foot-text">
          Use your assigned staff account to access workshop operations, customer records, and transaction tools.
        </div>
      </div>
    </div>

    <div class="right">
      <div class="dot-bg"></div>
      <div class="card">
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
              <router-link to="/forgot-password" class="forgot">Forgot password?</router-link>
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
    </div>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.container {
  display: flex;
  height: 100vh;
  font-family: 'Inter', sans-serif;
}

/* ── Left panel ── */
.left {
  width: 280px;
  background: #141414;
  display: flex;
  flex-direction: column;
  padding: 36px 28px;
  flex-shrink: 0;
  gap: 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px #2a2a2a;
}

.left h1 {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.brand-sub {
  font-size: 11px;
  color: #666;
  margin-top: 3px;
}

.feature-block {
  flex: 1;
  border-top: 1px solid #1f1f1f;
  padding-top: 24px;
}

.feature-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #555;
  margin-bottom: 14px;
  font-weight: 600;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feat {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #c0c0c0;
  line-height: 1.4;
}

.feat-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #444;
  flex-shrink: 0;
}

.left-foot {
  padding-top: 20px;
  border-top: 1px solid #1f1f1f;
}

.left-foot-title {
  font-size: 11px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: 6px;
}

.left-foot-text {
  font-size: 11px;
  color: #555;
  line-height: 1.6;
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
  padding-bottom: 60px; 
}

.dot-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #d0d0ce 1px, transparent 1px);
  background-size: 22px 22px;
  opacity: 0.5;
  pointer-events: none;
}

/* ── Card ── */
.card {
  position: relative;
  background: #fff;
  border: 1px solid #e8e8e6;
  border-radius: 16px;
  width: 340px;
  padding: 36px 32px;
}

.card-pill {
  display: inline-block;
  background: #f0f0ee;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  color: #888;
  font-weight: 500;
  margin-bottom: 14px;
}

.card h2 {
  font-size: 22px;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.5px;
  line-height: 1.2;
  margin-bottom: 4px;
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
  gap: 6px;
  margin-bottom: 20px;
  padding: 9px 12px;
  background: #f4f4f2;
  border-radius: 8px;
  border: 1px solid #eaeae8;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4CAF50;
  flex-shrink: 0;
}

.status-txt {
  font-size: 11px;
  color: #888;
}

/* ── Form fields ── */
.field {
  margin-bottom: 14px;
}

.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.field-row label {
  font-size: 12px;
  font-weight: 500;
  color: #555;
}

.forgot {
  font-size: 11px;
  color: #999;
  text-decoration: none;
}

.forgot:hover {
  color: #111;
}

.field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  background: #fafaf9;
  border: 1px solid #e4e4e2;
  border-radius: 8px;
  padding: 10px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #111;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus {
  border-color: #111;
  background: #fff;
}

.field input::placeholder {
  color: #ccc;
}

/* ── Button ── */
button {
  width: 100%;
  padding: 11px;
  background: #111;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  margin-top: 6px;
  transition: background 0.15s;
}

button:hover {
  background: #222;
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* ── Footer ── */
.card-foot {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: #aaa;
}

.card-foot a {
  color: #111;
  text-decoration: none;
  font-weight: 500;
}

.card-foot a:hover {
  text-decoration: underline;
}

/* ── Error ── */
.error {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: #e53935;
  background: #fff1f1;
  border: 1px solid #ffd6d6;
  border-radius: 8px;
  padding: 10px 12px;
}
</style>