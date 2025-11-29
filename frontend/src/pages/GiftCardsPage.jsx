import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Gift,
  CreditCard,
  Mail,
  User,
  MessageSquare,
  Check,
  Search,
  Wallet,
  Clock,
  ArrowRight,
  Sparkles,
  Heart,
  Cake,
  PartyPopper,
  ThumbsUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';
import { formatPrice } from '../utils/helpers';

const GiftCardsPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('buy');
  const [loading, setLoading] = useState(false);
  
  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    amount: 50,
    customAmount: '',
    recipientEmail: '',
    recipientName: '',
    senderName: '',
    message: '',
    theme: 'general',
  });

  // Check balance state
  const [checkCode, setCheckCode] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  // Redeem state
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  // My gift cards
  const [myPurchasedCards, setMyPurchasedCards] = useState([]);
  const [myRedeemedCards, setMyRedeemedCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const predefinedAmounts = [25, 50, 100, 150, 200, 500];

  const themes = [
    { id: 'general', label: 'General', icon: Gift, color: 'bg-gradient-to-br from-primary-500 to-purple-600' },
    { id: 'birthday', label: 'Birthday', icon: Cake, color: 'bg-gradient-to-br from-pink-500 to-rose-600' },
    { id: 'holiday', label: 'Holiday', icon: Sparkles, color: 'bg-gradient-to-br from-red-500 to-green-600' },
    { id: 'thankyou', label: 'Thank You', icon: Heart, color: 'bg-gradient-to-br from-rose-500 to-pink-600' },
    { id: 'congratulations', label: 'Congrats', icon: PartyPopper, color: 'bg-gradient-to-br from-yellow-500 to-orange-600' },
  ];

  useEffect(() => {
    if (isAuthenticated && activeTab === 'my-cards') {
      fetchMyCards();
    }
  }, [isAuthenticated, activeTab]);

  const fetchMyCards = async () => {
    setLoadingCards(true);
    try {
      const [purchased, redeemed] = await Promise.all([
        api.get('/gift-cards/purchased'),
        api.get('/gift-cards/redeemed'),
      ]);
      setMyPurchasedCards(purchased.data.data || []);
      setMyRedeemedCards(redeemed.data.data || []);
    } catch (error) {
      console.error('Error fetching gift cards:', error);
    } finally {
      setLoadingCards(false);
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to purchase a gift card');
      return;
    }

    const amount = purchaseForm.customAmount ? parseFloat(purchaseForm.customAmount) : purchaseForm.amount;
    
    if (amount < 10 || amount > 500) {
      toast.error('Amount must be between $10 and $500');
      return;
    }

    if (!purchaseForm.recipientEmail) {
      toast.error('Please enter recipient email');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/gift-cards', {
        amount,
        recipientEmail: purchaseForm.recipientEmail,
        recipientName: purchaseForm.recipientName,
        senderName: purchaseForm.senderName,
        message: purchaseForm.message,
        theme: purchaseForm.theme,
      });

      toast.success('Gift card purchased successfully!');
      setPurchaseForm({
        amount: 50,
        customAmount: '',
        recipientEmail: '',
        recipientName: '',
        senderName: '',
        message: '',
        theme: 'general',
      });
      
      // Show the gift card code
      const card = response.data.data;
      toast.success(`Gift Card Code: ${card.code}`, { duration: 10000 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to purchase gift card');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    if (!checkCode.trim()) {
      toast.error('Please enter a gift card code');
      return;
    }

    setChecking(true);
    try {
      const response = await api.get(`/gift-cards/check/${checkCode}`);
      setCheckResult(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gift card not found');
      setCheckResult(null);
    } finally {
      setChecking(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to redeem a gift card');
      return;
    }

    if (!redeemCode.trim()) {
      toast.error('Please enter a gift card code');
      return;
    }

    setRedeeming(true);
    try {
      const response = await api.post('/gift-cards/redeem', { code: redeemCode });
      toast.success(`Gift card redeemed! $${response.data.data.amount} added to your wallet.`);
      setRedeemCode('');
      fetchMyCards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to redeem gift card');
    } finally {
      setRedeeming(false);
    }
  };

  const selectedTheme = themes.find(t => t.id === purchaseForm.theme) || themes[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
            <Gift className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ShopHub Gift Cards
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Give the gift of choice - Perfect for any occasion!
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
            {[
              { id: 'buy', label: 'Buy Gift Card', icon: CreditCard },
              { id: 'check', label: 'Check Balance', icon: Search },
              { id: 'redeem', label: 'Redeem', icon: Wallet },
              ...(isAuthenticated ? [{ id: 'my-cards', label: 'My Cards', icon: Gift }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Buy Gift Card Tab */}
        {activeTab === 'buy' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Preview Card */}
            <div className="order-2 lg:order-1">
              <div className={`${selectedTheme.color} rounded-2xl p-6 text-white shadow-xl`}>
                <div className="flex justify-between items-start mb-8">
                  <Gift className="w-10 h-10" />
                  <span className="text-sm opacity-80">ShopHub Gift Card</span>
                </div>
                <div className="mb-6">
                  <p className="text-4xl font-bold">
                    {formatPrice(purchaseForm.customAmount ? parseFloat(purchaseForm.customAmount) || 0 : purchaseForm.amount)}
                  </p>
                </div>
                <div className="space-y-2 text-sm opacity-90">
                  {purchaseForm.recipientName && (
                    <p>To: {purchaseForm.recipientName}</p>
                  )}
                  {purchaseForm.senderName && (
                    <p>From: {purchaseForm.senderName}</p>
                  )}
                  {purchaseForm.message && (
                    <p className="italic">"{purchaseForm.message}"</p>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Form */}
            <div className="order-1 lg:order-2">
              <form onSubmit={handlePurchase} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Purchase a Gift Card
                </h2>

                {/* Amount Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Amount
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {predefinedAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setPurchaseForm({ ...purchaseForm, amount, customAmount: '' });
                        }}
                        className={`py-3 rounded-lg font-medium transition ${
                          purchaseForm.amount === amount && !purchaseForm.customAmount
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      placeholder="Custom amount (10-500)"
                      value={purchaseForm.customAmount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, customAmount: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Choose Theme
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setPurchaseForm({ ...purchaseForm, theme: theme.id })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                          purchaseForm.theme === theme.id
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 ring-2 ring-primary-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <theme.icon className="w-4 h-4" />
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="w-4 h-4" />
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={purchaseForm.recipientEmail}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientEmail: e.target.value })}
                      placeholder="gift@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.recipientName}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientName: e.target.value })}
                        placeholder="John"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.senderName}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, senderName: e.target.value })}
                        placeholder="Jane"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Personal Message
                    </label>
                    <textarea
                      value={purchaseForm.message}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, message: e.target.value })}
                      placeholder="Add a personal message..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {purchaseForm.message.length}/500
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Purchase Gift Card - {formatPrice(purchaseForm.customAmount ? parseFloat(purchaseForm.customAmount) || 0 : purchaseForm.amount)}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Check Balance Tab */}
        {activeTab === 'check' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Check Gift Card Balance
              </h2>
              <form onSubmit={handleCheckBalance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter Gift Card Code
                  </label>
                  <input
                    type="text"
                    value={checkCode}
                    onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                    placeholder="GIFT-XXXX-XXXX-XXXX"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-center font-mono tracking-wider"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checking}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {checking ? <Spinner size="sm" /> : <Search className="w-5 h-5" />}
                  Check Balance
                </button>
              </form>

              {checkResult && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {formatPrice(checkResult.currentBalance)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Original: {formatPrice(checkResult.initialBalance)}
                    </p>
                    {checkResult.expiryDate && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires: {new Date(checkResult.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                    <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      checkResult.isValid
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {checkResult.isValid ? <Check className="w-4 h-4" /> : null}
                      {checkResult.isValid ? 'Valid' : 'Expired/Invalid'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Redeem Tab */}
        {activeTab === 'redeem' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Redeem Gift Card
              </h2>
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please login to redeem your gift card
                  </p>
                  <Link to="/login" className="btn-primary">
                    Login to Continue
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRedeem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter Gift Card Code
                    </label>
                    <input
                      type="text"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                      placeholder="GIFT-XXXX-XXXX-XXXX"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-center font-mono tracking-wider"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={redeeming}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {redeeming ? <Spinner size="sm" /> : <Wallet className="w-5 h-5" />}
                    Redeem to Wallet
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    The gift card balance will be added to your ShopHub wallet
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

        {/* My Cards Tab */}
        {activeTab === 'my-cards' && isAuthenticated && (
          <div className="space-y-8">
            {loadingCards ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {/* Purchased Cards */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Gift Cards You've Sent
                  </h2>
                  {myPurchasedCards.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                      <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        You haven't purchased any gift cards yet
                      </p>
                      <button
                        onClick={() => setActiveTab('buy')}
                        className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Buy a Gift Card →
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myPurchasedCards.map((card) => (
                        <div
                          key={card._id}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                {card.code}
                              </p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatPrice(card.initialBalance)}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              card.currentBalance === card.initialBalance
                                ? 'bg-green-100 text-green-700'
                                : card.currentBalance > 0
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}>
                              {card.currentBalance === card.initialBalance ? 'Unused' : 
                               card.currentBalance > 0 ? 'Partial' : 'Used'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>To: {card.recipientName || card.recipientEmail}</p>
                            <p>Sent: {new Date(card.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Redeemed Cards */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Gift Card Balance
                  </h2>
                  {myRedeemedCards.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                      <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No active gift card balances
                      </p>
                      <button
                        onClick={() => setActiveTab('redeem')}
                        className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Redeem a Gift Card →
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myRedeemedCards.map((card) => (
                        <div
                          key={card._id}
                          className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl shadow-sm p-4 text-white"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <Gift className="w-8 h-8" />
                            <span className="text-sm opacity-80">Balance</span>
                          </div>
                          <p className="text-3xl font-bold mb-2">
                            {formatPrice(card.currentBalance)}
                          </p>
                          <p className="text-sm opacity-80">
                            Expires: {new Date(card.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftCardsPage;
