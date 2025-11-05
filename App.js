import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import { CartProvider } from "./components/cartContext"; // Import CartProvider
import Navbar from "./components/navbar";
import Hero from "./components/hero";
import SearchResults from "./components/searchresult";
import Footer from "./components/contact";
import ProductDetails from "./components/productDetail";
import CartPage from "./components/Cart"; // Import Cart Page
import BuyNowPage from "./components/buynow"; // Import BuyNowPage
import PaymentPage from "./components/payment";
import ConfirmationPage from "./components/ConfirmationPage"; // Import Confirmation Page
import Profile from "./components/EditProfile"; // Import Profile Component
import Orders from "./components/MyOrder"; // Import MyOrder Component
import FAQ from "./components/FAQ"; // Import FAQ Component
import ReturnPolicy from './components/Returnpolicy';
import ScrollToTop from "./components/scrolltotop"; // Import ScrollToTop Component'
import TrendingProducts from './components/trendingproduct'; // Import Trending Products Component
import NewArrivals from './components/newarrival'; // Import New Arrivals Component
import BestSellers from './components/bestseller'; // Import Best Sellers Component
import LogoLoader from "./components/loader"; // Import your loader
import Blogs from "./components/Blogs"; // Import Blogs Component
import Trackorder from "./components/trackorder"; // Import Track Order Component
import Auth from "./components/OtpAuth"; // Import Auth Component
import Signup from "./components/SignUp"; // Import Signup Component
import Orderhistory from "./components/OrderHistory"; // Import Order History Component
import AccountSettings from './components/AccountSettings';
import Blogdetails from './components/Blogdetail'; // Import Blog Details Component
import TermsAndConditions from './components/T&C'; // Import Terms and Conditions Component
import PrivacyPolicy from './components/PrivacyPolicy';
import ShippingPolicy from './components/ShippingPolicy'; // Import Shipping Policy Component
import CollectionPage from './components/CollectionPage';
import BackToTopButton from './components/BackToTopButton';
import "./App.css"; // Import custom CSS


function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading, replace with your real data fetching if needed
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LogoLoader />;

  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop /> {/* Add ScrollToTop component */}
        <Navbar /> {/* Add Navbar component */}
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/product/:slug" element={<ProductDetails />} /> {/* Updated for slug */}
          <Route path="/cart" element={<CartPage />} /> {/* Add Cart Route */}
          <Route path="/buy-now/:slug" element={<BuyNowPage />} /> {/* Updated for slug */}
          <Route path="/payment" element={<PaymentPage />} /> {/* Fix incorrect usage */}
          <Route path="/confirmation" element={<ConfirmationPage />} /> {/* Add confirmation page */}
          <Route path="/profile" element={<Profile />} /> {/* Add Profile Route */}
          <Route path="/orders" element={<Orders />} /> {/* Add My Orders Route */}
          <Route path="/faq" element={<FAQ />} /> {/* Add FAQ Route */}
          <Route path="/return" element={<ReturnPolicy />} /> {/* Add Return Policy Route */}
          <Route path="/trending" element={<TrendingProducts/>} /> {/* Add Trending Products Route */}
          <Route path="/new-arrivals" element={<NewArrivals/>} /> {/* Add New Arrivals Route */}
          <Route path="/best-sellers" element={<BestSellers/>} /> {/* Add Best Sellers Route */}
          <Route path="/blogs" element={<Blogs />} /> {/* Add Blogs Route */}
          <Route path="/track-order" element={<Trackorder />} /> {/* Add Track Order Route */}
          <Route path='/auth' element={<Auth/>} />{/* Placeholder for Auth Page */} 
          <Route path='/signup' element={<Signup/>} />{/* Placeholder for Signup Page */} 
          <Route path='/order-history' element={<Orderhistory/>} />{/* Placeholder for Order History Page */}
          <Route path='/account-settings' element={<AccountSettings/>} />{/* Placeholder for Account Settings Page */}
          <Route path="/blog/:slug" element={<Blogdetails />} /> {/* Add Blog Details Route */}
          <Route path="/terms" element={<TermsAndConditions />} /> {/* Add Terms and Conditions Route */}
          <Route path="/privacy" element={<PrivacyPolicy />} /> {/* Add Privacy Policy Route */}
          <Route path="/shipping" element={<ShippingPolicy />} /> {/* Add Shipping Policy Route */}
          <Route path="/collection/:category" element={<CollectionPage />} /> {/* Add Collection Page Route */}
        </Routes>
        <Footer  />
        <BackToTopButton /> {/* Add BackToTopButton component */}
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
