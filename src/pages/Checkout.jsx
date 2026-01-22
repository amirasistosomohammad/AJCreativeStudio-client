import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const formatPHP = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);

const Checkout = () => {
  const { cartItems, getCartTotal } = useCart();
  const { customer, customerToken, isCustomerAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [email, setEmail] = useState('jeffersonbalde13@gmail.com');
  const [emailNews, setEmailNews] = useState(false);
  const [country, setCountry] = useState('PH'); // Using country code
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [state, setState] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState(null); // null = auto, 'none' = no discount
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const productListRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3');
        const data = await response.json();
        // Sort countries alphabetically by name
        const sortedCountries = data.sort((a, b) => 
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sortedCountries);
        setLoadingCountries(false);
      } catch (error) {
        console.error('Error fetching countries:', error);
        // Fallback to a basic list if API fails
        setCountries([
          { name: { common: 'Philippines' }, cca2: 'PH' },
          { name: { common: 'United States' }, cca2: 'US' },
          { name: { common: 'United Kingdom' }, cca2: 'GB' },
          { name: { common: 'Canada' }, cca2: 'CA' },
          { name: { common: 'Australia' }, cca2: 'AU' },
        ]);
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Get states/provinces/regions/districts based on country
  const getSubdivisionOptions = (countryCode, subdivisionType) => {
    const subdivisionLists = {
      'US': {
        states: [
          'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
          'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
          'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
          'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
          'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
          'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
          'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
          'Wisconsin', 'Wyoming', 'District of Columbia'
        ]
      },
      'CA': {
        provinces: [
          'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
          'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
          'Quebec', 'Saskatchewan', 'Yukon'
        ]
      },
      'AU': {
        states: [
          'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland',
          'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
        ]
      },
      'PH': {
        regions: [
          'Albay', 'Batangas', 'Bohol', 'Bulacan', 'Cagayan', 'Camarines Sur', 'Cavite',
          'Cebu', 'Davao', 'Ilocos Norte', 'Iloilo', 'Laguna', 'Leyte', 'Metro Manila',
          'Negros Occidental', 'Pampanga', 'Pangasinan', 'Quezon', 'Rizal', 'Zamboanga del Sur'
        ]
      },
      'IN': {
        states: [
          'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
          'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
          'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
          'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
          'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
          'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
          'Ladakh', 'Lakshadweep', 'Puducherry'
        ]
      },
      'BR': {
        states: [
          'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
          'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
          'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
          'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina',
          'São Paulo', 'Sergipe', 'Tocantins'
        ]
      },
      'MX': {
        states: [
          'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
          'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato',
          'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
          'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
          'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
        ]
      },
      'DE': {
        states: [
          'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
          'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia',
          'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein',
          'Thuringia'
        ]
      },
      'FR': {
        regions: [
          'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire',
          'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy',
          'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
        ]
      },
      'IT': {
        regions: [
          'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia',
          'Lazio', 'Liguria', 'Lombardy', 'Marche', 'Molise', 'Piedmont', 'Puglia', 'Sardinia',
          'Sicily', 'Trentino-Alto Adige', 'Tuscany', 'Umbria', 'Valle d\'Aosta', 'Veneto'
        ]
      },
      'ES': {
        regions: [
          'Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country', 'Canary Islands',
          'Cantabria', 'Castile and León', 'Castile-La Mancha', 'Catalonia', 'Extremadura',
          'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarre', 'Valencia'
        ]
      },
      'JP': {
        prefectures: [
          'Aichi', 'Akita', 'Aomori', 'Chiba', 'Ehime', 'Fukui', 'Fukuoka', 'Fukushima', 'Gifu',
          'Gunma', 'Hiroshima', 'Hokkaido', 'Hyogo', 'Ibaraki', 'Ishikawa', 'Iwate', 'Kagawa',
          'Kagoshima', 'Kanagawa', 'Kochi', 'Kumamoto', 'Kyoto', 'Mie', 'Miyagi', 'Miyazaki',
          'Nagano', 'Nagasaki', 'Nara', 'Niigata', 'Oita', 'Okayama', 'Okinawa', 'Osaka',
          'Saga', 'Saitama', 'Shiga', 'Shimane', 'Shizuoka', 'Tochigi', 'Tokushima', 'Tokyo',
          'Tottori', 'Toyama', 'Wakayama', 'Yamagata', 'Yamaguchi', 'Yamanashi'
        ]
      },
      'CN': {
        provinces: [
          'Anhui', 'Beijing', 'Chongqing', 'Fujian', 'Gansu', 'Guangdong', 'Guangxi', 'Guizhou',
          'Hainan', 'Hebei', 'Heilongjiang', 'Henan', 'Hong Kong', 'Hubei', 'Hunan', 'Inner Mongolia',
          'Jiangsu', 'Jiangxi', 'Jilin', 'Liaoning', 'Macau', 'Ningxia', 'Qinghai', 'Shaanxi',
          'Shandong', 'Shanghai', 'Shanxi', 'Sichuan', 'Tianjin', 'Tibet', 'Xinjiang', 'Yunnan', 'Zhejiang'
        ]
      },
    };

    const options = subdivisionLists[countryCode]?.[subdivisionType] || [];
    // Sort regions alphabetically
    if (subdivisionType === 'regions') {
      return [...options].sort((a, b) => a.localeCompare(b));
    }
    return options;
  };

  // Get comprehensive address format configuration based on country
  const getAddressFormat = (countryCode) => {
    const formats = {
      'US': {
        fields: ['address', 'city', 'state', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: true,
        showProvince: false,
        showRegion: false,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        stateLabel: 'State',
        stateType: 'select',
        postalCodeLabel: 'ZIP code',
        postalCodePlaceholder: 'ZIP code',
        fieldOrder: ['address', 'city', 'state', 'postalCode'],
      },
      'GB': {
        fields: ['address', 'city', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: false,
        showProvince: false,
        showRegion: false,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        postalCodeLabel: 'Postcode',
        postalCodePlaceholder: 'Postcode',
        fieldOrder: ['address', 'city', 'postalCode'],
      },
      'CA': {
        fields: ['address', 'city', 'province', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: false,
        showProvince: true,
        showRegion: false,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        provinceLabel: 'Province',
        provinceType: 'select',
        postalCodeLabel: 'Postal code',
        postalCodePlaceholder: 'Postal code',
        fieldOrder: ['address', 'city', 'province', 'postalCode'],
      },
      'AU': {
        fields: ['address', 'city', 'state', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: true,
        showProvince: false,
        showRegion: false,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        stateLabel: 'State',
        stateType: 'select',
        postalCodeLabel: 'Postcode',
        postalCodePlaceholder: 'Postcode',
        fieldOrder: ['address', 'city', 'state', 'postalCode'],
      },
      'PH': {
        fields: ['address', 'city', 'region', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: false,
        showProvince: false,
        showRegion: true,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        regionLabel: 'Region',
        regionType: 'select',
        postalCodeLabel: 'Postal code',
        postalCodePlaceholder: 'Postal code',
        fieldOrder: ['address', 'city', 'region', 'postalCode'],
      },
      'IN': {
        fields: ['address', 'city', 'state', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: true,
        showProvince: false,
        showRegion: false,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        stateLabel: 'State',
        stateType: 'select',
        postalCodeLabel: 'PIN code',
        postalCodePlaceholder: 'PIN code',
        fieldOrder: ['address', 'city', 'state', 'postalCode'],
      },
      'BR': {
        fields: ['address', 'city', 'state', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: true,
        showProvince: false,
        showRegion: false,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        stateLabel: 'State',
        stateType: 'select',
        postalCodeLabel: 'CEP',
        postalCodePlaceholder: 'CEP',
        fieldOrder: ['address', 'city', 'state', 'postalCode'],
      },
      'MX': {
        fields: ['address', 'city', 'state', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: true,
        showProvince: false,
        showRegion: false,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        stateLabel: 'State',
        stateType: 'select',
        postalCodeLabel: 'Postal code',
        postalCodePlaceholder: 'Postal code',
        fieldOrder: ['address', 'city', 'state', 'postalCode'],
      },
      'DE': {
        fields: ['address', 'city', 'state', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: true,
        showProvince: false,
        showRegion: false,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        stateLabel: 'State',
        stateType: 'select',
        postalCodeLabel: 'Postal code',
        postalCodePlaceholder: 'Postal code',
        fieldOrder: ['address', 'city', 'state', 'postalCode'],
      },
      'FR': {
        fields: ['address', 'city', 'region', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: false,
        showProvince: false,
        showRegion: true,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        regionLabel: 'Region',
        regionType: 'select',
        postalCodeLabel: 'Postal code',
        postalCodePlaceholder: 'Postal code',
        fieldOrder: ['address', 'city', 'region', 'postalCode'],
      },
      'IT': {
        fields: ['address', 'city', 'region', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: false,
        showProvince: false,
        showRegion: true,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        regionLabel: 'Region',
        regionType: 'select',
        postalCodeLabel: 'Postal code',
        postalCodePlaceholder: 'Postal code',
        fieldOrder: ['address', 'city', 'region', 'postalCode'],
      },
      'ES': {
        fields: ['address', 'city', 'region', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: false,
        showProvince: false,
        showRegion: true,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        regionLabel: 'Region',
        regionType: 'select',
        postalCodeLabel: 'Postal code',
        postalCodePlaceholder: 'Postal code',
        fieldOrder: ['address', 'city', 'region', 'postalCode'],
      },
      'JP': {
        fields: ['address', 'city', 'prefecture', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: false,
        showProvince: false,
        showRegion: false,
        showPrefecture: true,
        showDistrict: false,
        showPostalCode: true,
        prefectureLabel: 'Prefecture',
        prefectureType: 'select',
        postalCodeLabel: 'Postal code',
        postalCodePlaceholder: 'Postal code',
        fieldOrder: ['address', 'city', 'prefecture', 'postalCode'],
      },
      'CN': {
        fields: ['address', 'city', 'province', 'postalCode'],
        showAddress: true,
        showCity: true,
        showState: false,
        showProvince: true,
        showRegion: false,
        showPrefecture: false,
        showDistrict: false,
        showPostalCode: true,
        provinceLabel: 'Province',
        provinceType: 'select',
        postalCodeLabel: 'Postal code',
        postalCodePlaceholder: 'Postal code',
        fieldOrder: ['address', 'city', 'province', 'postalCode'],
      },
    };

    // Default format for countries not specifically configured
    return formats[countryCode] || {
      fields: ['address', 'city', 'postalCode'],
      showAddress: true,
      showCity: true,
      showState: false,
      showProvince: false,
      showRegion: false,
      showPrefecture: false,
      showDistrict: false,
      showPostalCode: true,
      postalCodeLabel: 'Postal code',
      postalCodePlaceholder: 'Postal code',
      fieldOrder: ['address', 'city', 'postalCode'],
    };
  };

  const addressFormat = getAddressFormat(country);
  
  // Get subdivision options based on country and type
  const getSubdivisionOptionsForCountry = () => {
    if (addressFormat.showState) {
      return getSubdivisionOptions(country, 'states');
    } else if (addressFormat.showProvince) {
      return getSubdivisionOptions(country, 'provinces');
    } else if (addressFormat.showRegion) {
      return getSubdivisionOptions(country, 'regions');
    } else if (addressFormat.showPrefecture) {
      return getSubdivisionOptions(country, 'prefectures');
    }
    return [];
  };

  const subdivisionOptions = getSubdivisionOptionsForCountry();
  
  const subtotal = getCartTotal();
  const itemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Calculate auto discount based on item count
  let autoDiscountPercent = 0;
  if (itemsCount >= 10) {
    autoDiscountPercent = 0.3;
  } else if (itemsCount >= 5) {
    autoDiscountPercent = 0.2;
  } else if (itemsCount >= 3) {
    autoDiscountPercent = 0.1;
  }

  // Use selected discount or auto-apply based on item count
  let discountPercent = 0;
  if (selectedDiscount === 'none') {
    discountPercent = 0;
  } else {
    // Auto-apply based on item count
    discountPercent = autoDiscountPercent;
  }

  const discountAmount = subtotal * discountPercent;
  const finalTotal = subtotal - discountAmount;

  const firstCartItem = cartItems[0];

  // Show/hide "Scroll for more items" based on overflow + scroll position
  useEffect(() => {
    const el = productListRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 4;
    const isAtTop = el.scrollTop <= 2;
    setShowScrollHint(hasOverflow && isAtTop);
  }, [cartItems, isMobile]);

  const handleProductScroll = () => {
    const el = productListRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 4;
    const isAtTop = el.scrollTop <= 2;
    setShowScrollHint(hasOverflow && isAtTop);
  };
  // Auto-apply discount when user qualifies (if not manually disabled)
  useEffect(() => {
    if (autoDiscountPercent > 0 && selectedDiscount === 'none') {
      setSelectedDiscount(null); // Reset to auto-apply mode
    }
  }, [itemsCount, autoDiscountPercent]);

  const handleApplyDiscount = () => {
    // TODO: Implement discount code logic
  };

  const handlePayNow = async () => {
    // Validate required fields
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !address.trim() || !city.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const amount = discountPercent > 0 ? finalTotal : subtotal;
      
      // Step 1: Create order first
      // Debug: Log cart items structure
      console.log('Cart items before processing:', cartItems);
      
      // Ensure cart items have valid structure
      const orderItems = cartItems.map((item, index) => {
        // Check if item has required fields
        if (!item || (!item.id && item.product_id === undefined)) {
          console.error('Invalid cart item at index', index, ':', item);
          throw new Error(`Cart item at index ${index} is missing product ID`);
        }
        
        // Use product_id if available, otherwise use id
        const productIdValue = item.product_id || item.id;
        
        // Ensure product_id is an integer
        const productId = parseInt(productIdValue);
        if (isNaN(productId)) {
          console.error('Invalid product ID:', productIdValue, 'in item:', item);
          throw new Error(`Invalid product ID: ${productIdValue}`);
        }
        
        // Ensure quantity is an integer and at least 1
        const quantity = parseInt(item.quantity || 1);
        if (isNaN(quantity) || quantity < 1) {
          console.error('Invalid quantity:', item.quantity, 'in item:', item);
          throw new Error(`Invalid quantity for product ${productId}: ${item.quantity}`);
        }
        
        return {
          product_id: productId,
          quantity: quantity,
        };
      });
      
      console.log('Processed order items:', orderItems);
      
      const orderData = {
        items: orderItems,
        subtotal: subtotal,
        tax_amount: 0,
        discount_amount: discountPercent > 0 ? (subtotal - finalTotal) : 0,
        total_amount: amount,
        currency: 'PHP',
        billing_address: {
          name: `${firstName} ${lastName}`.trim(),
          email: email.trim(),
          address: address.trim() || null,
          city: city.trim() || null,
          region: region.trim() || null,
          state: state.trim() || null,
          postal_code: postalCode.trim() || null,
          country: country || 'PH',
        },
        shipping_address: {
          name: `${firstName} ${lastName}`.trim(),
          email: email.trim(),
          address: address.trim() || null,
          city: city.trim() || null,
          region: region.trim() || null,
          state: state.trim() || null,
          postal_code: postalCode.trim() || null,
          country: country || 'PH',
        },
      };

      // Add guest fields if not authenticated
      if (!isCustomerAuthenticated) {
        orderData.guest_email = email.trim();
        orderData.guest_name = `${firstName} ${lastName}`.trim();
      }

      // Create order
      const orderHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add auth token if customer is authenticated
      if (isCustomerAuthenticated && customerToken) {
        orderHeaders['Authorization'] = `Bearer ${customerToken}`;
      }

      const orderResponse = await fetch(`${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/orders`, {
        method: 'POST',
        headers: orderHeaders,
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        setIsProcessingPayment(false);
        console.error('Order creation error:', errorData);
        console.error('Order data sent:', orderData);
        console.error('Cart items:', cartItems);
        
        // Show detailed validation errors
        let errorMessage = errorData.message || 'Failed to create order. Please try again.';
        if (errorData.errors) {
          const errorDetails = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          errorMessage += '\n\nValidation Errors:\n' + errorDetails;
          console.error('Validation errors:', errorData.errors);
        }
        
        alert(errorMessage);
        return;
      }

      const orderResult = await orderResponse.json();
      
      if (!orderResult.success || !orderResult.order) {
        setIsProcessingPayment(false);
        alert('Failed to create order. Please try again.');
        return;
      }

      const order = orderResult.order;
      console.log('Order created:', order);

      // Store order info in localStorage for post-payment processing
      localStorage.setItem('pending_order', JSON.stringify({
        order_id: order.id,
        order_number: order.order_number,
        email: email.trim(),
      }));

      // Step 2: Create PayMaya checkout session with order
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/order/${order.order_number}`;
      const cancelUrl = `${baseUrl}/checkout/cancel`;
      const failureUrl = `${baseUrl}/checkout/failure`;

      // Create order description from cart items
      const orderDescription = cartItems.length === 1 
        ? cartItems[0].title || cartItems[0].name 
        : `${cartItems.length} items`;

      const checkoutUrl = `${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/payments/paymaya/checkout`;
      console.log('Calling PayMaya checkout API:', checkoutUrl);
      
      // Split name into first and last name for PayMaya
      const customerFullName = `${firstName} ${lastName}`.trim();
      const nameParts = customerFullName.split(' ');
      const customerFirstName = nameParts[0] || firstName || 'Customer';
      const customerLastName = nameParts.slice(1).join(' ') || lastName || '';
      
      const checkoutResponse = await fetch(checkoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          order_id: order.id, // Pass order database ID
          order_number: order.order_number, // Also pass order number
          description: orderDescription,
          success_url: successUrl,
          cancel_url: cancelUrl,
          failure_url: failureUrl,
          customer: {
            name: customerFullName, // Full name for reference
            first_name: customerFirstName, // First name for PayMaya
            last_name: customerLastName, // Last name for PayMaya
            email: email.trim(),
            phone: '', // Add phone field if needed
          },
        }),
      });

      // Check if response is ok before parsing JSON
      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json().catch(() => ({}));
        setIsProcessingPayment(false);
        console.error('PayMaya API error:', {
          status: checkoutResponse.status,
          statusText: checkoutResponse.statusText,
          data: errorData,
        });
        alert(errorData.message || errorData.error || `Payment failed (${checkoutResponse.status}). Please try again.`);
        return;
      }

      const checkoutData = await checkoutResponse.json();
      console.log('PayMaya checkout response:', checkoutData);

      if (checkoutData.success && checkoutData.checkout?.redirect_url) {
        // Redirect to PayMaya checkout page
        console.log('Redirecting to PayMaya:', checkoutData.checkout.redirect_url);
        // Small delay to ensure state is updated before redirect
        setTimeout(() => {
          window.location.href = checkoutData.checkout.redirect_url;
        }, 100);
      } else {
        setIsProcessingPayment(false);
        console.error('PayMaya checkout failed:', checkoutData);
        alert(checkoutData.message || 'Failed to create payment session. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessingPayment(false);
      alert('Network error. Please check your connection and try again.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Your cart is empty</h2>
        <button
          onClick={() => navigate('/all-products')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#000',
            color: '#FFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isMobile
        ? '#FFFFFF'
        : 'linear-gradient(to right, #FFFFFF 0 50%, #F5F5F5 50% 100%)',
      padding: '2rem 1rem',
      position: 'relative',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '2rem' : '0',
        alignItems: 'stretch',
        position: 'relative',
      }}>
        {/* Center divider between panels */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: '1px',
              transform: 'translateX(-0.5px)',
              backgroundColor: '#D0D0D0',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Left Section - Contact & Payment */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          backgroundColor: '#FFFFFF',
          padding: '2rem',
          minHeight: isMobile ? 'auto' : 'calc(100vh - 4rem)',
        }}>
          {/* Contact Section */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#000',
                margin: 0,
              }}>
                Contact
              </h2>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Implement sign in
                }}
                style={{
                  color: '#0066CC',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Sign in
              </a>
            </div>
            
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{
                  border: '2px solid rgba(255, 215, 0, 0.5)',
                }}
              />
            </div>
            
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={emailNews}
                onChange={(e) => setEmailNews(e.target.checked)}
                id="emailNews"
                style={{
                  cursor: 'pointer',
                }}
              />
              <label className="form-check-label" htmlFor="emailNews" style={{ cursor: 'pointer' }}>
                Email me with news and offers
              </label>
            </div>
          </div>

          {/* Payment Section */}
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#000',
              margin: '0 0 0.5rem 0',
            }}>
              Payment
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: '#666',
              margin: '0 0 1.5rem 0',
            }}>
              All transactions are secure and encrypted.
            </p>
            
            {/* Payment Method */}
            <div style={{
              border: '2px solid #0066CC',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#F8F9FA',
              marginBottom: '1rem',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#000',
                    marginBottom: '0.25rem',
                  }}>
                    Xendit - Cards, Bank Transfers, QR, Ewallets
                  </div>
                </div>
                <div style={{
                  width: '60px',
                  height: '30px',
                  backgroundColor: '#0066CC',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  Xendit
                </div>
              </div>
            </div>
            
            {/* Redirect Icon and Text */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '1.5rem',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#E0E0E0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#666"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M10 4v4" />
                  <path d="M2 8h20" />
                  <path d="M6 4v4" />
                  <line x1="18" y1="12" x2="20" y2="12" />
                  <line x1="18" y1="16" x2="20" y2="16" />
                </svg>
              </div>
              <p style={{
                fontSize: '0.85rem',
                color: '#666',
                textAlign: 'center',
                margin: 0,
                maxWidth: '400px',
              }}>
                After clicking "Pay now", you will be redirected to Xendit - Cards, Bank Transfers, QR, Ewallets to complete your purchase securely.
              </p>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#000',
              margin: '0 0 1rem 0',
            }}>
              Billing address
            </h2>
            
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                Country/Region
              </label>
              <select
                className="form-select"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  // Clear all subdivision fields when country changes
                  setRegion('');
                  setState('');
                  setPrefecture('');
                  setCity('');
                  setPostalCode('');
                  setAddress('');
                }}
                disabled={loadingCountries}
                style={{
                  border: '2px solid rgba(255, 215, 0, 0.5)',
                  cursor: 'pointer',
                }}
              >
                {loadingCountries ? (
                  <option value="">Loading countries...</option>
                ) : (
                  countries.map((countryData) => (
                    <option key={countryData.cca2} value={countryData.cca2}>
                      {countryData.name.common}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                  First name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  style={{
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                  }}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                  Last name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  style={{
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                  }}
                />
              </div>
            </div>

            {/* Address field - always shown */}
            {addressFormat.showAddress && (
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                  Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address"
                  style={{
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                  }}
                />
              </div>
            )}

            {/* City field - conditionally shown */}
            {addressFormat.showCity && (
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                  City
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  style={{
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                  }}
                />
              </div>
            )}

            {/* State field (for US, AU, IN, BR, MX, DE, etc.) */}
            {addressFormat.showState && (
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                  {addressFormat.stateLabel || 'State'}
                </label>
                {addressFormat.stateType === 'select' && subdivisionOptions.length > 0 ? (
                  <select
                    className="form-select"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    style={{
                      border: '2px solid rgba(255, 215, 0, 0.5)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select {addressFormat.stateLabel || 'State'}</option>
                    {subdivisionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder={addressFormat.stateLabel || 'State'}
                    style={{
                      border: '2px solid rgba(255, 215, 0, 0.5)',
                    }}
                  />
                )}
              </div>
            )}

            {/* Province field (for Canada, China, etc.) */}
            {addressFormat.showProvince && (
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                  {addressFormat.provinceLabel || 'Province'}
                </label>
                {addressFormat.provinceType === 'select' && subdivisionOptions.length > 0 ? (
                  <select
                    className="form-select"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    style={{
                      border: '2px solid rgba(255, 215, 0, 0.5)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select {addressFormat.provinceLabel || 'Province'}</option>
                    {subdivisionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder={addressFormat.provinceLabel || 'Province'}
                    style={{
                      border: '2px solid rgba(255, 215, 0, 0.5)',
                    }}
                  />
                )}
              </div>
            )}

            {/* Region field (for Philippines, France, Italy, Spain, etc.) */}
            {addressFormat.showRegion && (
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                  {addressFormat.regionLabel || 'Region'}
                </label>
                {addressFormat.regionType === 'select' && subdivisionOptions.length > 0 ? (
                  <select
                    className="form-select"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    style={{
                      border: '2px solid rgba(255, 215, 0, 0.5)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select {addressFormat.regionLabel || 'Region'}</option>
                    {subdivisionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder={addressFormat.regionLabel || 'Region'}
                    style={{
                      border: '2px solid rgba(255, 215, 0, 0.5)',
                    }}
                  />
                )}
              </div>
            )}

            {/* Prefecture field (for Japan) */}
            {addressFormat.showPrefecture && (
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                  {addressFormat.prefectureLabel || 'Prefecture'}
                </label>
                {addressFormat.prefectureType === 'select' && subdivisionOptions.length > 0 ? (
                  <select
                    className="form-select"
                    value={prefecture}
                    onChange={(e) => setPrefecture(e.target.value)}
                    style={{
                      border: '2px solid rgba(255, 215, 0, 0.5)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select {addressFormat.prefectureLabel || 'Prefecture'}</option>
                    {subdivisionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    value={prefecture}
                    onChange={(e) => setPrefecture(e.target.value)}
                    placeholder={addressFormat.prefectureLabel || 'Prefecture'}
                    style={{
                      border: '2px solid rgba(255, 215, 0, 0.5)',
                    }}
                  />
                )}
              </div>
            )}

            {/* Postal code field - conditionally shown */}
            {addressFormat.showPostalCode && (
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', marginBottom: '0.5rem' }}>
                  {addressFormat.postalCodeLabel || 'Postal code'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={addressFormat.postalCodePlaceholder || 'Postal code'}
                  style={{
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                  }}
                />
              </div>
            )}

            {/* Mobile Order Summary (collapsed) */}
            {isMobile && (
              <div
                style={{
                  marginTop: '1.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                {/* Collapsible total row */}
                <button
                  type="button"
                  onClick={() => setIsMobileSummaryOpen((open) => !open)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #D0D0D0',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {firstCartItem && (
                      <img
                        src={firstCartItem.image}
                        alt={firstCartItem.title}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          border: '1px solid #E0E0E0',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '0.35rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            color: '#000',
                          }}
                        >
                          Total
                        </span>
                        <span
                          style={{
                            fontSize: '0.9rem',
                            color: '#666',
                          }}
                        >
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      {discountPercent > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginTop: '0.15rem',
                            fontSize: '0.9rem',
                            color: '#4F7F5A',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>Total savings {formatPHP(discountAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginLeft: '0.5rem',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '999px',
                        border: '1px solid #E0E0E0',
                        color: '#777',
                      }}
                    >
                      PHP
                    </span>
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#000',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatPHP(discountPercent > 0 ? finalTotal : subtotal)}
                    </span>
                    <motion.span
                      animate={{ rotate: isMobileSummaryOpen ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="#666"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.span>
                  </div>
                </button>

                {/* Collapsible product list */}
                <AnimatePresence>
                  {isMobileSummaryOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        overflow: 'hidden',
                        backgroundColor: '#F5F5F5',
                        borderRadius: '12px',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                        marginTop: '-0.5rem',
                        padding: '0.75rem 1rem 0.75rem',
                      }}
                    >
                      {/* Full mobile details: items + summary */}
                      {cartItems.map((item) => (
                        <div
                          key={`mobile-${item.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.6rem 0',
                          }}
                        >
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img
                              src={item.image}
                              alt={item.title}
                              style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '6px',
                                border: '1px solid #E0E0E0',
                                objectFit: 'cover',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: '#000',
                                color: '#FFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                              }}
                            >
                              {item.quantity}
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '0.5rem',
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.9rem',
                                color: '#333',
                                lineHeight: 1.4,
                                flex: 1,
                              }}
                            >
                              {item.title}
                            </div>
                            <div
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: '#000',
                                whiteSpace: 'nowrap',
                                marginLeft: '0.5rem',
                              }}
                            >
                              {formatPHP(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Summary block (same logic as desktop, mobile-friendly layout) */}
                      <div
                        style={{
                          borderTop: '1px solid #E0E0E0',
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                        }}
                      >
                        {/* Subtotal */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.4rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              color: '#000',
                            }}
                          >
                            Subtotal · {itemsCount}{' '}
                            {itemsCount === 1 ? 'item' : 'items'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: '#000',
                            }}
                          >
                            {formatPHP(subtotal)}
                          </span>
                        </div>

                        {/* Order discount */}
                        {discountPercent > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '0.4rem',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                marginRight: '0.5rem',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 500,
                                  color: '#000',
                                }}
                              >
                                Order discount
                              </span>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  color: '#666',
                                  marginTop: '0.1rem',
                                }}
                              >
                                {itemsCount >= 10
                                  ? 'BUY 10 GET 30% OFF'
                                  : itemsCount >= 5
                                  ? 'BUY 5 GET 20% OFF'
                                  : itemsCount >= 3
                                  ? 'BUY 3 GET 10% OFF'
                                  : 'Order discount'}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: '#4F7F5A',
                              }}
                            >
                              -{formatPHP(discountAmount)}
                            </span>
                          </div>
                        )}

                        {/* Total */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '0.4rem',
                            paddingTop: '0.4rem',
                            borderTop: '1px solid #E0E0E0',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: '#000',
                            }}
                          >
                            Total
                          </span>
                          <span
                            style={{
                              fontSize: '1rem',
                              fontWeight: 700,
                              color: '#000',
                            }}
                          >
                            PHP{' '}
                            {formatPHP(
                              discountPercent > 0 ? finalTotal : subtotal,
                            )}
                          </span>
                        </div>

                        {/* Total savings */}
                        {discountPercent > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '0.35rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#4F7F5A',
                                textTransform: 'uppercase',
                              }}
                            >
                              TOTAL SAVINGS
                            </span>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#4F7F5A',
                              }}
                            >
                              {formatPHP(discountAmount)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Mobile discount pill with remove (inside dropdown) */}
                      {discountPercent > 0 && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.9rem',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '999px',
                            border: '1px solid #E0E0E0',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: '#333',
                          }}
                        >
                          <span style={{ whiteSpace: 'nowrap' }}>
                            {itemsCount >= 10
                              ? 'BUY 10 GET 30% OFF'
                              : itemsCount >= 5
                              ? 'BUY 5 GET 20% OFF'
                              : 'BUY 3 GET 10% OFF'}
                          </span>
                          <span
                            style={{ color: '#4F7F5A', whiteSpace: 'nowrap' }}
                          >
                            -{formatPHP(discountAmount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedDiscount('none')}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: '#666',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.2rem',
                              lineHeight: 1,
                            }}
                            aria-label="Remove discount"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Pay Now Button */}
            <motion.button
              whileHover={!isProcessingPayment ? { y: -2, backgroundColor: '#222222' } : {}}
              whileTap={!isProcessingPayment ? { y: 0 } : {}}
              onClick={handlePayNow}
              disabled={isProcessingPayment}
              style={{
                width: '100%',
                padding: '0.9rem 1.5rem',
                backgroundColor: isProcessingPayment ? '#666' : '#000000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.98rem',
                fontWeight: 600,
                cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                marginTop: '2rem',
                opacity: isProcessingPayment ? 0.7 : 1,
              }}
            >
              {isProcessingPayment ? 'Processing...' : 'Pay now'}
            </motion.button>

            {/* Copyright Notice */}
            <div style={{
              marginTop: '2rem',
              fontSize: '0.875rem',
              color: '#999',
            }}>
              All rights reserved AJ Creative Studio
            </div>
          </div>
        </div>

        {/* Right Section - Order Summary (desktop only) */}
        {!isMobile && (
          <div style={{
            backgroundColor: '#F5F5F5',
            padding: '2rem',
            position: 'fixed',
            top: '5.5rem',
            right: 'max(1rem, (100vw - 1200px) / 2)',
            height: 'calc(100vh - 6rem)',
            maxHeight: 'calc(100vh - 6rem)',
            width: 'min(100%, 520px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 10,
          }}>

          {/* Product Items - Scrollable */}
          <div
            ref={productListRef}
            onScroll={handleProductScroll}
            style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              overflowX: 'hidden',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              paddingTop: '1rem',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              minHeight: 0,
              maxHeight: '100%',
              position: 'relative',
            }}
          >
            {cartItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  position: 'relative',
                  flexShrink: 0,
                }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid #E0E0E0',
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#000',
                    color: '#FFF',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}>
                    {item.quantity}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#000',
                      margin: 0,
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    {item.title}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#000',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatPHP(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
            {/* Scroll indicator - only when overflow & at top */}
            {/* Scroll indicator - desktop only */}
            {!isMobile && (
              <AnimatePresence>
                {showScrollHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      textAlign: 'center',
                      padding: '0.4rem 0.8rem',
                      color: '#444',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '999px',
                      margin: '0.5rem auto 0.25rem',
                      maxWidth: '220px',
                      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.08)',
                      position: 'sticky',
                      bottom: 4,
                    }}
                  >
                    Scroll for more items ↓
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Applied Discount Badge */}
          {discountPercent > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F5F5F5',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flex: 1,
                minWidth: 0,
              }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#666"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#333',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {(() => {
                    if (itemsCount >= 10) {
                      return `BUY 10 GET 30% OFF - ${formatPHP(discountAmount)}`;
                    } else if (itemsCount >= 5) {
                      return `BUY 5 GET 20% OFF - ${formatPHP(discountAmount)}`;
                    } else if (itemsCount >= 3) {
                      return `BUY 3 GET 10% OFF - ${formatPHP(discountAmount)}`;
                    }
                    return '';
                  })()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDiscount('none');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E8E8E8';
                  e.currentTarget.style.color = '#D32F2F';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#666';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Order Summary Totals */}
          <div style={{
            borderTop: '1px solid #E0E0E0',
            paddingTop: '1.5rem',
            flexShrink: 0,
          }}>
            {/* Subtotal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}>
              <span style={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#000',
              }}>
                Subtotal · {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
              </span>
              <span style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#000',
              }}>
                {formatPHP(subtotal)}
              </span>
            </div>

            {/* Order Discount */}
            {discountPercent > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.75rem',
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#000',
                  }}>
                    Order discount
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#666',
                    marginTop: '0.25rem',
                  }}>
                    {(() => {
                      if (itemsCount >= 10) {
                        return 'BUY 10 GET 30% OFF';
                      } else if (itemsCount >= 5) {
                        return 'BUY 5 GET 20% OFF';
                      } else if (itemsCount >= 3) {
                        return 'BUY 3 GET 10% OFF';
                      }
                      return 'Order discount';
                    })()}
                  </span>
                </div>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#4F7F5A',
                }}>
                  -{formatPHP(discountAmount)}
                </span>
              </div>
            )}

            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: discountPercent > 0 ? '0.75rem' : '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #E0E0E0',
            }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#000',
              }}>
                Total
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#000',
              }}>
                PHP {formatPHP(discountPercent > 0 ? finalTotal : subtotal)}
              </span>
            </div>

            {/* Total Savings */}
            {discountPercent > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4F7F5A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#4F7F5A',
                    textTransform: 'uppercase',
                  }}>
                    TOTAL SAVINGS
                  </span>
                </div>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#4F7F5A',
                }}>
                  {formatPHP(discountAmount)}
                </span>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;

