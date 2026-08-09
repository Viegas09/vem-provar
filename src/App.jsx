import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Restaurant from "./pages/Restaurant";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import RestaurantSignUp from "./pages/RestaurantSignUp";
import RestaurantDashboard from "./pages/RestaurantDashboard";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurante/:slug" element={<Restaurant />} />
        <Route path="/carrinho" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/criar-conta" element={<SignUp />} />
        <Route path="/cadastro-restaurante" element={<RestaurantSignUp />} />
        <Route path="/painel-restaurante" element={<RestaurantDashboard />} />
      </Routes>
    </>
  );
}

export default App;
