import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
} from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry: Registry;

  // === MÉTRICAS DE NEGOCIO ===
  readonly sessionsStarted: Counter<string>;
  readonly interactions: Counter<string>;
  readonly activeUsers: Gauge<string>;

  // === MÉTRICAS TÉCNICAS ===
  readonly httpDuration: Histogram<string>;
  readonly httpErrors: Counter<string>;
  readonly httpRequests: Counter<string>;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ app: 'lastmile-backend-1' });
    collectDefaultMetrics({ register: this.registry });

    // Negocio
    this.sessionsStarted = new Counter({
      name: 'sessions_started_total',
      help: 'Total de sesiones iniciadas (logins)',
      registers: [this.registry],
    });

    this.interactions = new Counter({
      name: 'interactions_total',
      help: 'Interacciones realizadas por tipo',
      labelNames: ['type'] as const,
      registers: [this.registry],
    });

    this.activeUsers = new Gauge({
      name: 'active_users_total',
      help: 'Usuarios registrados activos en la plataforma',
      registers: [this.registry],
    });

    // Técnicas
    this.httpDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'Duración de requests HTTP en milisegundos',
      labelNames: ['method', 'route', 'status'] as const,
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2000],
      registers: [this.registry],
    });

    this.httpRequests = new Counter({
      name: 'http_requests_total',
      help: 'Total de requests HTTP',
      labelNames: ['method', 'route', 'status'] as const,
      registers: [this.registry],
    });

    this.httpErrors = new Counter({
      name: 'http_errors_total',
      help: 'Total de errores HTTP (4xx y 5xx)',
      labelNames: ['status'] as const,
      registers: [this.registry],
    });
  }

  // ---- Listeners de eventos de negocio ----

  @OnEvent('donation.created')
  onDonationCreated() {
    this.interactions.inc({ type: 'donation_money' });
  }

  @OnEvent('donation.item.received')
  onDonationItemReceived() {
    this.interactions.inc({ type: 'donation_item' });
  }

  @OnEvent('campaign.created')
  onCampaignCreated() {
    this.interactions.inc({ type: 'campaign_created' });
  }

  @OnEvent('event.created')
  onEventCreated() {
    this.interactions.inc({ type: 'event_created' });
  }

  @OnEvent('campaign.inventory.updated')
  onCampaignInventoryUpdated() {
    this.interactions.inc({ type: 'inventory_update' });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  contentType(): string {
    return this.registry.contentType;
  }
}
