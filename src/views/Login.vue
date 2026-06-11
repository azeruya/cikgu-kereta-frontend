<template>
  <div class="login-page">
    <div class="dot-bg"></div>
    <div class="soft-glow glow-one"></div>
    <div class="soft-glow glow-two"></div>

    <div class="login-panel">
      <!-- LEFT BRAND PANEL -->
      <section class="brand-panel">
        <div class="brand-top">
          <img src="../assets/vulcan_bg.png" class="brand-logo" />

          <div>
            <h1>Vulcan Auto Service</h1>
            <p>Workshop Management</p>
          </div>
        </div>

        <div class="brand-content">
          <span class="brand-pill">Internal workspace</span>

          <h2>Run your daily workshop operations securely.</h2>

          <p class="brand-desc">
            Access customers, inventory, transactions, payments, expenses, and reports from one secure workspace.
          </p>

          <div class="module-list">
            <div class="module-item">
              <span class="module-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3Z" />
                  <path d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Z" />
                  <path d="M16 13c-2.2 0-4 1.12-4 2.5V18h8v-2.5c0-1.38-1.8-2.5-4-2.5Z" />
                  <path d="M8 13c-2.2 0-4 1.12-4 2.5V18h6v-2.5c0-.8.34-1.54.94-2.14A6.3 6.3 0 0 0 8 13Z" />
                </svg>
              </span>
              <span>Customer &amp; vehicle records</span>
            </div>

            <div class="module-item">
              <span class="module-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 8.5 12 3 3 8.5l9 5.5 9-5.5Z" />
                  <path d="M3 8.5V16l9 5 9-5V8.5" />
                  <path d="M12 14v7" />
                </svg>
              </span>
              <span>Inventory &amp; stock alerts</span>
            </div>

            <div class="module-item">
              <span class="module-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z" />
                  <path d="M9 8h6" />
                  <path d="M9 12h6" />
                  <path d="M9 16h3" />
                </svg>
              </span>
              <span>Quotation, invoice &amp; receipt</span>
            </div>

            <div class="module-item">
              <span class="module-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M3 7h18v10H3V7Z" />
                  <path d="M7 11h4" />
                  <path d="M17 14h.01" />
                  <path d="M3 10h18" />
                </svg>
              </span>
              <span>Payments &amp; expenses</span>
            </div>

            <div class="module-item">
              <span class="module-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M4 19V5" />
                  <path d="M20 19H4" />
                  <path d="M8 16v-5" />
                  <path d="M12 16V8" />
                  <path d="M16 16v-3" />
                </svg>
              </span>
              <span>Reports &amp; online requests</span>
            </div>
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

        <p class="form-foot">
          No account?
          <router-link to="/register">Request access</router-link>
        </p>

        <p v-if="error" class="error">{{ error }}</p>
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
  background: #f9f9f8;
  display: flex;
  align-items: center;
  padding-bottom: 80px;
  justify-content: center;
  padding: 48px;
  position: relative;
  overflow: hidden;
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
  filter: blur(20px);
  opacity: 0.5;
  pointer-events: none;
}

.glow-one {
  width: 260px;
  height: 260px;
  top: 10%;
  right: 12%;
  background: rgba(0, 0, 0, 0.045);
}

.glow-two {
  width: 220px;
  height: 220px;
  bottom: 12%;
  left: 16%;
  background: rgba(0, 0, 0, 0.035);
}

/* MAIN SPLIT CARD */
.login-panel {
  position: relative;
  z-index: 1;
  width: min(900px, 100%);
  min-height: 520px;
  display: grid;
  grid-template-columns: 0.95fr 1fr;
  background: #ffffff;
  border: 1px solid #e5e5e2;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.1);
}

/* LEFT PANEL */
.brand-panel {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 45%),
    #161616;
  color: #ffffff;
  padding: 36px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand-top {
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
  box-shadow:
    0 0 0 2px #2d2d2d,
    0 14px 32px rgba(0, 0, 0, 0.35);
}

.brand-top h1 {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.35px;
  line-height: 1.2;
}

.brand-top p {
  font-size: 12px;
  color: #818181;
  margin-top: 3px;
}

.brand-content {
  margin-top: 48px;
}

.brand-pill {
  display: inline-flex;
  padding: 6px 11px;
  border-radius: 999px;
  background: #242424;
  color: #b8b8b8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 18px;
}

.brand-content h2 {
  max-width: 360px;
  font-size: 32px;
  line-height: 1.08;
  letter-spacing: -1.2px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 14px;
}

.brand-desc {
  max-width: 370px;
  font-size: 13px;
  line-height: 1.7;
  color: #8f8f8f;
  margin-bottom: 30px;
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid #292929;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #292929;
  color: #c8c8c8;
  font-size: 13px;
  font-weight: 500;
}

.module-icon {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: #242424;
  border: 1px solid #303030;
  color: #a8a8a8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.module-item:hover .module-icon {
  background: #2c2c2c;
  color: #ffffff;
}

.brand-foot {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #7c7c7c;
  font-size: 11px;
  line-height: 1.5;
  padding-top: 22px;
}

.secure-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4caf50;
  flex-shrink: 0;
}

/* RIGHT PANEL */
.form-panel {
  padding: 54px 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.status-bar {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  padding: 8px 12px;
  background: #edf5e8;
  border-radius: 999px;
  color: #2f6b1f;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 24px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf50;
}

.form-heading {
  margin-bottom: 30px;
}

.form-heading h2 {
  font-size: 26px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.8px;
  margin-bottom: 5px;
}

.form-heading p {
  font-size: 14px;
  color: #666;
}

/* FORM */
.field {
  margin-bottom: 18px;
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
  height: 42px;
  background: #fafaf9;
  border: 1px solid #dededa;
  border-radius: 9px;
  padding: 0 13px;
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
  color: #bfbfbc;
}

button {
  width: 100%;
  height: 44px;
  background: #111;
  border: none;
  border-radius: 9px;
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

.form-foot {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: #777;
}

.form-foot a {
  color: #111;
  font-weight: 700;
  text-decoration: none;
}

.form-foot a:hover {
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

/* RESPONSIVE */
@media (max-width: 900px) {
  .login-page {
    padding: 28px;
  }

  .login-panel {
    grid-template-columns: 1fr;
    max-width: 460px;
  }

  .brand-panel {
    padding: 28px;
  }

  .brand-content {
    margin-top: 34px;
  }

  .brand-content h2,
  .brand-desc,
  .module-list {
    display: none;
  }

  .brand-foot {
    margin-top: 28px;
  }

  .form-panel {
    padding: 36px 28px;
  }
}

@media (max-width: 520px) {
  .login-page {
    padding: 16px;
    align-items: stretch;
  }

  .login-panel {
    min-height: auto;
    border-radius: 20px;
  }

  .brand-panel {
    padding: 24px;
  }

  .form-panel {
    padding: 30px 24px;
  }

  .brand-logo {
    width: 42px;
    height: 42px;
  }

  .brand-top h1 {
    font-size: 15px;
  }
}
</style>