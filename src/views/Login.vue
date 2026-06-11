<template>
  <div class="login-page">
    <div class="dot-bg"></div>

    <div class="login-panel">
      <!-- LEFT BRAND PANEL -->
      <section class="brand-panel">
        <div class="brand-top">
          <img src="../assets/vulcan_bg.png" class="brand-logo" alt="Vulcan Auto Service" />
          <div>
            <h1>Vulcan Auto Service</h1>
            <p>Workshop Management</p>
          </div>
        </div>

        <div class="portal-card">
          <div>
            <span class="portal-label">Staff portal</span>
            <p>Role-based access for workshop operations.</p>
          </div>
          <span class="portal-badge">Secure</span>
        </div>

        <div class="module-list">
          <div class="module-item">
            <span class="module-icon">
              <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3Z" /><path d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Z" /><path d="M16 13c-2.2 0-4 1.12-4 2.5V18h8v-2.5c0-1.38-1.8-2.5-4-2.5Z" /><path d="M8 13c-2.2 0-4 1.12-4 2.5V18h6v-2.5c0-.8.34-1.54.94-2.14A6.3 6.3 0 0 0 8 13Z" /></svg>
            </span>
            <span>Customer &amp; vehicle records</span>
          </div>
          <div class="module-item">
            <span class="module-icon">
              <svg viewBox="0 0 24 24"><path d="M21 8.5 12 3 3 8.5l9 5.5 9-5.5Z" /><path d="M3 8.5V16l9 5 9-5V8.5" /><path d="M12 14v7" /></svg>
            </span>
            <span>Inventory &amp; stock alerts</span>
          </div>
          <div class="module-item">
            <span class="module-icon">
              <svg viewBox="0 0 24 24"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h3" /></svg>
            </span>
            <span>Quotation, invoice &amp; receipt</span>
          </div>
          <div class="module-item">
            <span class="module-icon">
              <svg viewBox="0 0 24 24"><path d="M3 7h18v10H3V7Z" /><path d="M7 11h4" /><path d="M17 14h.01" /><path d="M3 10h18" /></svg>
            </span>
            <span>Payments &amp; expenses</span>
          </div>
          <div class="module-item">
            <span class="module-icon">
              <svg viewBox="0 0 24 24"><path d="M4 19V5" /><path d="M20 19H4" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-3" /></svg>
            </span>
            <span>Reports &amp; online requests</span>
          </div>
        </div>

        <div class="brand-foot">
          <div class="secure-dot"></div>
          <span>Role-based access for Admin and Staff accounts</span>
        </div>
      </section>

      <!-- RIGHT LOGIN FORM -->
      <section class="form-panel">
        <div class="status-bar">
          <span class="status-dot"></span>
          <span>All systems operational</span>
        </div>

        <div class="form-heading">
          <h2>Sign in</h2>
          <p>Use your assigned staff account</p>
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

          <transition name="fade">
            <p v-if="error" class="error">{{ error }}</p>
          </transition>

          <button type="submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? "Signing in…" : "Sign in" }}
          </button>
        </form>

        <p class="form-foot">
          No account? <router-link to="/register">Request access</router-link>
        </p>
      </section>
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
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.login-page {
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background: #f4f4f2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  position: relative;
  overflow: hidden;
}

.dot-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #c8c8c5 1px, transparent 1px);
  background-size: 22px 22px;
  opacity: 0.4;
  pointer-events: none;
}

/* MAIN SPLIT CARD */
.login-panel {
  position: relative;
  z-index: 1;
  width: min(860px, 100%);
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #ffffff;
  border: 1px solid #e2e2de;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.09);
}

/* ── LEFT PANEL ── */
.brand-panel {
  background: #161616;
  color: #ffffff;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px #2d2d2d, 0 8px 24px rgba(0, 0, 0, 0.4);
}

.brand-top h1 {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.2;
  color: #fff;
}

.brand-top p {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

/* Module list pushed down with flex gap */
.module-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-top: 1px solid #252525;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 0;
  border-bottom: 1px solid #252525;
  color: #bdbdbd;
  font-size: 13px;
  font-weight: 400;
  transition: color 0.15s;
}

.module-item span:last-child {
  line-height: 1.35;
}

.module-item:hover {
  color: #e0e0e0;
}

.module-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #222;
  border: 1px solid #2e2e2e;
  color: #888;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}

.module-item:hover .module-icon {
  background: #2a2a2a;
  color: #ccc;
}

.module-icon svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.brand-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  font-size: 11px;
}

.secure-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf50;
  flex-shrink: 0;
}

/* ── RIGHT PANEL ── */
.form-panel {
  padding: 48px 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
}

.status-bar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 5px 10px;
  background: #eef5e9;
  border: 1px solid #d4e8cc;
  border-radius: 999px;
  color: #2e6b1e;
  font-size: 11.5px;
  font-weight: 500;
  margin-bottom: 28px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf50;
}

.form-heading {
  margin-bottom: 28px;
}

.form-heading h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.6px;
  margin-bottom: 4px;
}

.form-heading p {
  font-size: 13.5px;
  color: #888;
}

/* portal card */
.portal-card {
  padding: 14px;
  background: linear-gradient(180deg, #202020, #1a1a1a);
  border: 1px solid #2b2b2b;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.portal-label {
  display: block;
  font-size: 10px;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  margin-bottom: 4px;
}

.portal-card p {
  font-size: 12px;
  color: #c8c8c8;
  line-height: 1.45;
}

.portal-badge {
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(76, 175, 80, 0.12);
  color: #72c577;
  border: 1px solid rgba(76, 175, 80, 0.22);
  font-size: 10px;
  font-weight: 700;
}

/* ── FIELDS ── */
.field {
  margin-bottom: 16px;
}

.field label,
.field-row label {
  display: block;
  font-size: 12.5px;
  font-weight: 500;
  color: #444;
  margin-bottom: 6px;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.field-row label {
  margin-bottom: 0;
}

.forgot {
  font-size: 12px;
  color: #999;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}

.forgot:hover {
  color: #111;
}

.field input {
  width: 100%;
  height: 40px;
  background: #fafaf9;
  border: 1px solid #e0e0dc;
  border-radius: 8px;
  padding: 0 12px;
  font-family: "Inter", sans-serif;
  font-size: 13.5px;
  color: #111;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field input:focus {
  border-color: #333;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.06);
}

.field input::placeholder {
  color: #c0c0bc;
}

/* ── BUTTON ── */
button[type="submit"] {
  width: 100%;
  height: 42px;
  background: #111;
  border: none;
  border-radius: 8px;
  font-family: "Inter", sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s, opacity 0.15s;
}

button[type="submit"]:hover:not(:disabled) {
  background: #222;
}

button[type="submit"]:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Loading spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── ERROR ── */
.error {
  font-size: 12.5px;
  line-height: 1.5;
  color: #c0392b;
  background: #fdf3f2;
  border: 1px solid #f5c6c2;
  border-radius: 8px;
  padding: 9px 12px;
  margin-bottom: 4px;
}

/* Error fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── FOOTER ── */
.form-foot {
  margin-top: 16px;
  text-align: center;
  font-size: 12.5px;
  color: #999;
}

.form-foot a {
  color: #111;
  font-weight: 600;
  text-decoration: none;
}

.form-foot a:hover {
  text-decoration: underline;
}

/* ── RESPONSIVE ── */
@media (max-width: 860px) {
  .login-page {
    padding: 24px;
    align-items: flex-start;
  }

  .login-panel {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin: auto;
  }

  .brand-panel {
    gap: 20px;
    padding: 24px;
  }

  .module-list {
    display: none;
  }

  .brand-foot {
    display: none;
  }

  .form-panel {
    padding: 32px 28px;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 0;
    background: #fff;
  }

  .login-panel {
    border-radius: 0;
    border: none;
    box-shadow: none;
    max-width: 100%;
    min-height: 100vh;
  }

  .brand-panel {
    padding: 20px 24px;
  }

  .form-panel {
    padding: 28px 24px;
  }
}
</style>