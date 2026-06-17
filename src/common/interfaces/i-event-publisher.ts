export interface DomainEvent {
  eventName: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

export interface IEventPublisher {
  publish(event: DomainEvent): void;
}
