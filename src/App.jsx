import { Routes, Route, useLocation } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import InstallPrompt from "./components/InstallPrompt";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Restaurant from "./pages/Restaurant";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import MyOrders from "./pages/MyOrders";
import Favorites from "./pages/Favorites";
import MyData from "./pages/MyData";
import PartnerLogin from "./pages/partner/Login";
import PartnerSignUp from "./pages/partner/SignUp";
import PartnerOnboarding from "./pages/partner/Onboarding";
import PartnerDashboard from "./pages/partner/Dashboard";
import DriverComingSoon from "./pages/driver/ComingSoon";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";

function App() {
  const location = useLocation();
  const isPortalRoute = /^\/(parceiro|entregador|admin)/.test(location.pathname);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/busca" element={<Search />} />
        <Route path="/restaurante/:slug" element={<Restaurant />} />
        <Route path="/carrinho" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
        <Route path="/pedido/:id" element={<OrderTracking />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/criar-conta" element={<SignUp />} />
        <Route path="/meus-pedidos" element={<MyOrders />} />
        <Route path="/favoritos" element={<Favorites />} />
        <Route path="/meus-dados" element={<MyData />} />

        <Route path="/parceiro/entrar" element={<PartnerLogin />} />
        <Route path="/parceiro/criar-conta" element={<PartnerSignUp />} />
        <Route path="/parceiro/cadastro" element={<PartnerOnboarding />} />
        <Route path="/parceiro/painel" element={<PartnerDashboard />} />

        <Route path="/entregador/entrar" element={<DriverComingSoon />} />
        <Route path="/entregador/criar-conta" element={<DriverComingSoon />} />
        <Route path="/entregador/cadastro" element={<DriverComingSoon />} />
        <Route path="/entregador/painel" element={<DriverComingSoon />} />

        <Route path="/admin/entrar" element={<AdminLogin />} />
        <Route path="/admin/painel" element={<AdminDashboard />} />
      </Routes>
      <InstallPrompt />
      {!isPortalRoute && <BottomNav />}
    </>
  );
}

export default App;
