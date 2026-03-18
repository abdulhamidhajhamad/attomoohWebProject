import { useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Clock,
  Wrench,
  CheckCircle2,
  Truck,
  PauseCircle,
  BarChart3,
  FileText,
} from 'lucide-react';
import { useServiceOrdersStore } from '../../../shared/store/serviceOrdersStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiServiceOrder, ApiServiceOrderStatus } from '../../../shared/api/types';
import styles from './ServiceOrders.module.css';

const STATUS_MAP: Record<ApiServiceOrderStatus, { label: string; icon: typeof Clock; css: string }> = {
  waiting: { label: 'بانتظار الصيانة', icon: Clock, css: styles.statusWaiting },
  in_maintenance: { label: 'قيد الصيانة', icon: Wrench, css: styles.statusInMaintenance },
  postponed: { label: 'مؤجل', icon: PauseCircle, css: styles.statusPostponed },
  ready: { label: 'جاهز للتسليم', icon: CheckCircle2, css: styles.statusReady },
  delivered: { label: 'تم التسليم', icon: Truck, css: styles.statusDelivered },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getMachineTypeName(order: ApiServiceOrder): string {
  if (order.machineType && typeof order.machineType === 'object') {
    return (order.machineType as { name?: string }).name || '—';
  }
  return order.machineDetails || '—';
}

function getTechName(order: ApiServiceOrder): string {
  if (!order.assignedTo) return '';
  if (typeof order.assignedTo === 'object') {
    return (order.assignedTo as { name?: string }).name || '';
  }
  return '';
}

export default function ServiceOrdersPage() {
  const {
    orders,
    orderStats,
    loading,
    error,
    fetchOrders,
    fetchOrderStats,
  } = useServiceOrdersStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('status') || '';

  useEffect(() => {
    fetchOrders(activeFilter || undefined);
  }, [fetchOrders, activeFilter]);

  useEffect(() => {
    fetchOrderStats();
  }, [fetchOrderStats]);

  const handleFilter = useCallback(
    (status: string) => {
      if (status) {
        setSearchParams({ status });
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams],
  );

  if (loading && orders.length === 0) {
    return (
      <div className={styles.page}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <ClipboardList size={24} />
            أوامر الخدمة
          </h1>
          <p className={styles.pageSubtitle}>
            إدارة أوامر الصيانة والخدمة من الاستقبال حتى التسليم
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/admin/maintenance/service-orders/receive" className={styles.btnPrimary}>
            <Plus size={18} />
            أمر جديد
          </Link>
        </div>
      </div>

      {/* Stats */}
      {orderStats && (
        <div className={styles.statsGrid}>
          <div
            className={`${styles.statCard} ${!activeFilter ? styles.statCardActive : ''}`}
            onClick={() => handleFilter('')}
          >
            <BarChart3 size={22} className={styles.statIconBlue} />
            <div className={styles.statValue}>{orderStats.total}</div>
            <div className={styles.statLabel}>الإجمالي</div>
          </div>
          <div
            className={`${styles.statCard} ${activeFilter === 'waiting' ? styles.statCardActive : ''}`}
            onClick={() => handleFilter('waiting')}
          >
            <Clock size={22} className={styles.statIconYellow} />
            <div className={styles.statValue}>{orderStats.byStatus['waiting'] || 0}</div>
            <div className={styles.statLabel}>بانتظار</div>
          </div>
          <div
            className={`${styles.statCard} ${activeFilter === 'in_maintenance' ? styles.statCardActive : ''}`}
            onClick={() => handleFilter('in_maintenance')}
          >
            <Wrench size={22} className={styles.statIconPurple} />
            <div className={styles.statValue}>{orderStats.byStatus['in_maintenance'] || 0}</div>
            <div className={styles.statLabel}>قيد الصيانة</div>
          </div>
          <div
            className={`${styles.statCard} ${activeFilter === 'ready' ? styles.statCardActive : ''}`}
            onClick={() => handleFilter('ready')}
          >
            <CheckCircle2 size={22} className={styles.statIconGreen} />
            <div className={styles.statValue}>{orderStats.byStatus['ready'] || 0}</div>
            <div className={styles.statLabel}>جاهز للتسليم</div>
          </div>
          <div
            className={`${styles.statCard} ${activeFilter === 'delivered' ? styles.statCardActive : ''}`}
            onClick={() => handleFilter('delivered')}
          >
            <Truck size={22} className={styles.statIconGray} />
            <div className={styles.statValue}>{orderStats.byStatus['delivered'] || 0}</div>
            <div className={styles.statLabel}>تم التسليم</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      {/* Orders List */}
      <div className={styles.ordersList}>
        {orders.map((order) => {
          const statusInfo = STATUS_MAP[order.status];
          const StatusIcon = statusInfo?.icon || Clock;
          return (
            <Link
              key={order._id}
              to={`/admin/maintenance/service-orders/${order._id}`}
              className={styles.orderCard}
            >
              <div className={styles.orderNumber}>#{order.formNumber}</div>
              <div className={styles.orderInfo}>
                <div className={styles.orderMachine}>{getMachineTypeName(order)}</div>
                <div className={styles.orderCustomer}>
                  {order.customerName} — {order.customerPhone}
                </div>
              </div>
              <div className={styles.orderMeta}>
                {getTechName(order) && (
                  <span className={styles.techBadge}>
                    👤 {getTechName(order)}
                  </span>
                )}
                <span className={`${styles.statusBadge} ${statusInfo?.css || ''}`}>
                  <StatusIcon size={14} />
                  {statusInfo?.label || order.status}
                </span>
                <span className={styles.orderDate}>
                  {formatDate(order.receptionDate || order.createdAt)}
                </span>
              </div>
            </Link>
          );
        })}

        {orders.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={48} />
            <p>لا يوجد أوامر خدمة {activeFilter && 'بهذه الحالة'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
