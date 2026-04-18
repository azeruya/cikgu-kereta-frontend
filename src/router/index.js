import { createRouter, createWebHistory } from "vue-router";

import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Dashboard from "../views/Dashboard.vue";
import Customers from "../views/Customers.vue";

const routes = [
    { path: "/login", component: Login },
    { path: "/register", component: Register },
    { path: "/dashboard", component: Dashboard },
    { path: "/customers", component: Customers }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;