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
          <h2>Run your workshop operations securely.</h2>
          <p>
            Access customer records, inventory, transactions, payments, expenses,
            reports, and online service requests from one workspace.
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

        <div class="module-chips">
          <span>Customers</span>
          <span>Inventory</span>
          <span>Invoices</span>
          <span>Expenses</span>
          <span>Reports</span>
        </div>
      </section>

      <section class="image-side">
        <img src="../assets/cg_pic.jpg" class="hero-image" alt="Workshop preview" />

        <div class="image-overlay">
          <div>
            <span class="overlay-label">Vulcan Auto Service</span>
            <p>Workshop operations, documents, and records in one system.</p>
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
}

/* LEFT FORM SIDE */
.login-side {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.intro {
  text-align: center;
  margin-bottom: 28px;
  max-width: 520px;
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
  font-size: 48px;
  line-height: 1.02;
  font-weight: 700;
  letter-spacing: -2px;
  color: #111;
  margin-bottom: 16px;
}

.intro p {
  font-size: 15px;
  color: #666;
  line-height: 1.65;
  max-width: 470px;
  margin: 0 auto;
}

/* LOGIN CARD */
.card {
  width: min(420px, 100%);
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
.image-side {
  position: relative;
  height: min(72vh, 680px);
  min-height: 520px;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid #e4e4df;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.1);
  background: #e9e6df;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* optional dark overlay at bottom */
.image-overlay {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 24px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(17, 17, 17, 0.72);
  backdrop-filter: blur(10px);
  color: #fff;
}

.overlay-label {
  display: block;
  font-size: 11px;
  color: #bdbdbd;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  margin-bottom: 6px;
}

.image-overlay p {
  font-size: 14px;
  line-height: 1.55;
  color: #f1f1f1;
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

  .image-side {
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