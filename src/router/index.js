import { createRouter, createWebHistory } from "vue-router";

import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Dashboard from "../views/Dashboard.vue";
import Customers from "../views/Customers.vue";
import Transactions from "../views/Transactions.vue";
import TransactionCreate from "../views/TransactionCreate.vue";
import TransactionDetail from "../views/TransactionDetail.vue";
import Inventory from "../views/Inventory.vue";
import Expenses from "../views/Expenses.vue";
import Reports from "../views/Reports.vue";
import PartForm from "../views/PartForm.vue";
import Users from "../views/Users.vue";

const routes = [
  {
    path: "/",
    redirect: () => (localStorage.getItem("token") ? "/dashboard" : "/login"),
  },
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { guestOnly: true },
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/customers",
    name: "customers",
    component: Customers,
    meta: { requiresAuth: true },
  },
  {
    path: "/transactions",
    name: "transactions",
    component: Transactions,
    meta: { requiresAuth: true },
  },
  {
    path: "/transactions/new",
    name: "transaction-create",
    component: TransactionCreate,
    meta: { requiresAuth: true },
  },
  {
    path: "/transactions/:id(\\d+)",
    name: "transaction-detail",
    component: TransactionDetail,
    meta: { requiresAuth: true },
  },
  {
    path: "/transactions/:id/edit",
    name: "transaction-edit",
    component: TransactionCreate,
    meta: { requiresAuth: true },
    },
  {
    path: "/inventory",
    name: "inventory",
    component: Inventory,
    meta: { requiresAuth: true },
  },
  {
    path: "/inventory/new",
    name: "inventory-create",
    component: PartForm,
    meta: { requiresAuth: true },
    },
    {
    path: "/inventory/:id(\\d+)/edit",
    name: "inventory-edit",
    component: PartForm,
    meta: { requiresAuth: true },
    },
  {
    path: "/expenses",
    name: "expenses",
    component: Expenses,
    meta: { requiresAuth: true },
  },
  {
    path: "/reports",
    name: "reports",
    component: Reports,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/users",
    name: "users",
    component: Users,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (to.meta.requiresAuth && !token) {
    return next("/login");
  }

  if (to.meta.requiresAdmin && user?.role !== "admin") {
    return next("/dashboard");
  }

  next();
});

export default router;