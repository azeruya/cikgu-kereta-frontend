<template>
  <div>
    <h2>Login</h2>

    <input v-model="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Password" />

    <button @click="login">Login</button>

    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import api from "../services/api";

export default {
  data() {
    return {
      email: "",
      password: "",
      error: ""
    };
  },

  methods: {
    async login() {
      try {
        const res = await api.post("/login", {
          email: this.email,
          password: this.password
        });

        localStorage.setItem("token", res.data.token);

        alert("Login success!");
        console.log(res.data);

      } catch (err) {
        this.error = err.response.data.message;
      }
    }
  }
};
</script>