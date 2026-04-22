<template>
  <div class="container">
    <div class="left">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="7" height="7" rx="2" fill="#141414"/>
            <rect x="11" y="2" width="7" height="7" rx="2" fill="#141414"/>
            <rect x="2" y="11" width="7" height="7" rx="2" fill="#141414"/>
            <rect x="11" y="11" width="7" height="7" rx="2" fill="#333"/>
          </svg>
        </div>
        <h1>Cikgu Kereta</h1>
        <p class="brand-sub">Workshop Management</p>
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

        <div class="left-foot">
        <div class="left-foot-title">Secure internal access</div>
        <div class="left-foot-text">
            Use your assigned staff account to access workshop operations, customer records, and transaction tools.
        </div>
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
            <label>Password</label>
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
.feature-block {
  margin-top: 40px;
}

.feature-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8a8a8a;
  margin-bottom: 14px;
  font-weight: 600;
}

.left {
  width: 300px;
  background: #141414;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 32px;
  flex-shrink: 0;
  gap: 20px;
}

.left-foot {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid #232323;
}

.left-foot-title {
  font-size: 12px;
  font-weight: 600;
  color: #c5bebe;
  margin-bottom: 6px;
}

.left-foot-text {
  font-size: 11px;
  color: #8a8a8a;
  line-height: 1.5;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.brand-icon svg {
  width: 20px;
  height: 20px;
}

.left h1 {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.4px;
  line-height: 1;
}

.brand-sub {
  font-size: 12px;
  color: #7a7a7a;
  font-weight: 400;
  margin-top: 6px;
}

.feat {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #d1d1d1;
  line-height: 1.4;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.feat-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #6a6a6a;
  flex-shrink: 0;
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