<template>
  <div>
    <h2>Register</h2>

    <input v-model="name" placeholder="Name" />
    <input v-model="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Password" />
    <input v-model="password_confirmation" type="password" placeholder="Confirm Password" />

    <button @click="register">Register</button>

    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import api from "../services/api";

export default {
  data() {
    return {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      error: ""
    };
  },

  methods: {
    async register() {
      try {
        const res = await api.post("/register", {
          name: this.name,
          email: this.email,
          password: this.password,
          password_confirmation: this.password_confirmation
        });

        localStorage.setItem("token", res.data.token);

        alert("Registered!");
        console.log(res.data);

      } catch (err) {
        this.error = err.response.data.message;
      }
    }
  }
};
</script>