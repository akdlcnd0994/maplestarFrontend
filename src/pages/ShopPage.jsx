import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getImageUrl } from '../services/api';
import { formatDateTime } from '../utils/format';
import Modal from '../components/Modal';

export default function ShopPage({ setPage }) {
  const { user, isLoggedIn, checkAuth } = useAuth();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('shop');
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const itemRes = await api.getShopItems();
      setItems(itemRes.data || []);
      if (isLoggedIn) {
        const balRes = await api.getPointBalance();
        setBalance(balRes.data?.balance || 0);
      }
    } catch (e) {
      setError('데이터를 불러오지 못했습니다.');
    }
    setLoading(false);
  };

  const loadOrders = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await api.getShopOrders({ limit: 30 });
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (tab === 'orders') loadOrders();
  }, [tab]);

  const handlePurchase = async () => {
    if (!selectedItem || purchasing) return;
    setPurchasing(true);
    try {
      const res = await api.purchaseShopItem(selectedItem.id, 1);
      alert(res.data?.message || '교환 완료!');
      setBalance(res.data?.newBalance ?? balance);
      setSelectedItem(null);
      loadData();
      checkAuth();
    } catch (e) {
      alert(e.message || '구매에 실패했습니다.');
    }
    setPurchasing(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('point')}>← 포인트</button>
        <h1>포인트 교환소</h1>
      </div>

      {isLoggedIn && (
        <div className="shop-balance-bar">
          <span>내 포인트</span>
          <span className="shop-balance-amount">{balance.toLocaleString()}P</span>
        </div>
      )}

      <div className="shop-tabs">
        <button className={`shop-tab ${tab === 'shop' ? 'active' : ''}`} onClick={() => setTab('shop')}>교환소</button>
        {isLoggedIn && <button className={`shop-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>교환 내역</button>}
      </div>

      {tab === 'shop' && (
        <div className="shop-item-grid">
          {loading && <div className="loading">로딩 중...</div>}
          {error && !loading && (
            <div className="error-state">
              <p>{error}</p>
              <button className="retry-btn" onClick={loadData}>다시 시도</button>
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="empty-message">등록된 상품이 없습니다.</div>
          )}
          {!loading && !error && items.map(item => (
            <div key={item.id} className={`shop-item-card ${item.stock <= 0 ? 'sold-out' : ''}`} onClick={() => {
              if (item.stock > 0 && isLoggedIn) setSelectedItem(item);
            }}>
              <div className="shop-item-image">
                {item.image_url ? (
                  <img src={getImageUrl(item.image_url)} alt={item.name} />
                ) : (
                  <div className="shop-item-no-image">No Image</div>
                )}
                {item.stock <= 0 && <div className="shop-item-soldout-badge">품절</div>}
              </div>
              <div className="shop-item-info">
                <div className="shop-item-name">{item.name}</div>
                {item.description && <div className="shop-item-desc">{item.description}</div>}
                <div className="shop-item-footer">
                  <span className="shop-item-price">{item.price.toLocaleString()}P</span>
                  <span className="shop-item-stock">재고 {item.stock}개</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="shop-order-list">
          {orders.length === 0 && <div className="empty-message">교환 내역이 없습니다.</div>}
          {orders.map(order => (
            <div key={order.id} className="shop-order-item">
              <div className="shop-order-left">
                <span className="shop-order-name">{order.item_name}</span>
                <span className="shop-order-qty">x{order.quantity}</span>
              </div>
              <div className="shop-order-right">
                <span className="shop-order-price">-{order.total_price.toLocaleString()}P</span>
                <span className="shop-order-date">{formatDateTime(order.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 구매 확인 모달 */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="상품 교환">
        {selectedItem && (
          <div className="shop-purchase-modal">
            {selectedItem.image_url && (
              <div className="shop-purchase-image">
                <img src={getImageUrl(selectedItem.image_url)} alt={selectedItem.name} />
              </div>
            )}
            <div className="shop-purchase-name">{selectedItem.name}</div>
            {selectedItem.description && <div className="shop-purchase-desc">{selectedItem.description}</div>}
            <div className="shop-purchase-price-row">
              <span>교환 포인트</span>
              <span className="shop-purchase-price">{selectedItem.price.toLocaleString()}P</span>
            </div>
            <div className="shop-purchase-price-row">
              <span>내 포인트</span>
              <span>{balance.toLocaleString()}P</span>
            </div>
            <div className="shop-purchase-price-row">
              <span>교환 후 잔액</span>
              <span className={balance - selectedItem.price < 0 ? 'insufficient' : ''}>
                {(balance - selectedItem.price).toLocaleString()}P
              </span>
            </div>
            {balance < selectedItem.price ? (
              <div className="shop-purchase-warning">포인트가 부족합니다.</div>
            ) : (
              <button className="shop-purchase-btn" onClick={handlePurchase} disabled={purchasing}>
                {purchasing ? '처리 중...' : '교환하기'}
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
