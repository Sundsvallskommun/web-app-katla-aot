/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Type of event */
export enum EventType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  UNKNOWN = 'UNKNOWN',
}

/** ConversationType model */
export enum ConversationType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}

/** Action to take on the source errand after handover */
export enum HandoverSourceAction {
  CLOSE = 'CLOSE',
  RETAIN = 'RETAIN',
  SUSPEND = 'SUSPEND',
}

/** Type of warning raised while building a handover preview: PARAMETER_SCHEMA_MISMATCH (a parameter references a json schema not registered in the target namespace, see 'key'/'detail'), ROLE_NOT_IN_TARGET (a stakeholder role on the source errand does not exist in the target namespace, see 'value') */
export enum WarningType {
  PARAMETER_SCHEMA_MISMATCH = 'PARAMETER_SCHEMA_MISMATCH',
  ROLE_NOT_IN_TARGET = 'ROLE_NOT_IN_TARGET',
}

/** Reason a target was auto-suggested for a namespace-bound field: NAME_EXACT (exact match on technical name), DISPLAY_NAME_EXACT (case-insensitive exact match on display name), RESOURCE_PATH_MATCH (match on hierarchical resource path, labels only) */
export enum MatchReason {
  NAME_EXACT = 'NAME_EXACT',
  DISPLAY_NAME_EXACT = 'DISPLAY_NAME_EXACT',
  RESOURCE_PATH_MATCH = 'RESOURCE_PATH_MATCH',
}

/** Priority model */
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Problem {
  /** @format uri */
  instance?: string;
  /** @format uri */
  type?: string;
  title?: string;
  detail?: string;
  /** @format int32 */
  status?: number;
}

export interface ConstraintViolationProblem {
  /** @format uri */
  type?: string;
  /** @format int32 */
  status?: number;
  violations?: Violation[];
  title?: string;
  /** @format uri */
  instance?: string;
  causeAsProblem?: ThrowableProblem;
  detail?: string;
}

export interface ThrowableProblem {
  /** @format uri */
  type?: string;
  title?: string;
  /** @format int32 */
  status?: number;
  detail?: string;
  /** @format uri */
  instance?: string;
  causeAsProblem?: any;
}

export interface Violation {
  field?: string;
  message?: string;
}

/** Field of an errand exposed to a role */
export interface FieldAccess {
  /** Field to expose */
  field: FieldAccessFieldEnum;
  /** Keys to expose when the field is a keyed collection. The whole collection is exposed when left empty */
  keys?: string[];
}

/** What limited read means within the namespace */
export interface LimitedReadAccess {
  /** Resources reachable on an errand the labels of the user only grant them limited read for. The errand itself is always reachable, listing resources here extends limited read beyond it. Read only, so no access level is given per resource */
  resources?: LimitedReadAccessResourcesEnum[];
  /** Fields of the errand exposed, applying instead of the fields of any role the user holds, when role based mapping is active */
  fields?: FieldAccess[];
}

/** Namespace configuration model */
export interface NamespaceConfig {
  /** Namespace */
  namespace?: string;
  /** Municipality connected to the namespace */
  municipalityId?: string;
  /** Display name for the namespace */
  displayName: string;
  /** Prefix for errand numbers in this namespace */
  shortCode: string;
  /**
   * Time to live (in days) for notifications created in this namespace
   * @format int32
   */
  notificationTTLInDays?: number;
  /**
   * Timestamp when the configuration was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the configuration was last modified
   * @format date-time
   */
  modified?: string;
  /** If set to true access control will be enabled. If no value is set it defaults to false. */
  accessControl?: boolean;
  /** If set to true notification will be sent to the stakeholder when stakeholder with reporter role recieves an internal message. If no value is set it defaults to false. */
  notifyReporter?: boolean;
  /** If set to true errands are mapped according to the fields configured for the roles held by the requesting user. Users holding no role, and all users when set to false, receive the full errand. If no value is set it defaults to false. */
  roleBasedMapping?: boolean;
  /** If set to true the resources a user may reach are decided by the access mapper in addition to their labels. Leave false until the namespace has resource access configured there, otherwise no resource can be reached. If no value is set it defaults to false. */
  resourceAccessControl?: boolean;
  /** What a user whose labels only grant them limited read for an errand may reach on it. Limited read always reaches the errand itself, listing resources here extends it beyond that, up to what read access gives. The fields apply instead of the fields of any role the user holds */
  limitedReadAccess?: LimitedReadAccess;
  /** Access given to the reporter of an errand. Leaving it out means reporters get nothing beyond what their labels already grant */
  reporterAccess?: ReporterAccess;
  /** Restricts the errand to the listed fields for holders of a role supplied by the access mapper, when role based mapping is active. A role that is not listed is not restricted and sees the errand in full */
  roleFieldRestrictions?: RoleFieldRestriction[];
}

/** Access given to the reporter of an errand */
export interface ReporterAccess {
  /** Resources the reporter may reach on their own errand, and what they may do with each. The access mapper knows nothing about reporters, so this is the only place their resources are granted */
  resources?: ResourceAccess[];
  /** Fields of the errand exposed to its reporter. These widen whatever else applies, whether or not the namespace maps errands per role, since reporting an errand may never reduce what its reporter sees */
  fields?: FieldAccess[];
}

/** Resource a role may reach, and what it may do with it */
export interface ResourceAccess {
  /** Resource to grant access to */
  resource: ResourceAccessResourceEnum;
  /** Access level granted for the resource */
  level: ResourceAccessLevelEnum;
}

/** Restricts the errand to a set of fields for holders of one role */
export interface RoleFieldRestriction {
  /**
   * Role the restriction applies to, as supplied by the access mapper
   * @minLength 1
   */
  role: string;
  /** Fields the errand is restricted to. Applies to errands the user has read or read/write for, an errand they only have limited read for uses limitedReadAccess instead */
  fields?: FieldAccess[];
}

/** Errand action parameter model */
export interface ActionParameter {
  /**
   * Parameter key
   * @minLength 1
   */
  key: string;
  /** Parameter values. Each value can have a maximum length of 2000 characters */
  values?: string[];
}

/** Errand action config model */
export interface Config {
  /** Unique id for action config */
  id?: string;
  /**
   * Name of the type of action. Must match an existing action definition
   * @minLength 1
   */
  name: string;
  /**
   * If set to true, action will be active
   * @default false
   */
  active?: boolean;
  /**
   * Conditions for when the action should be added to errand. Parameters must match action definition.
   * @minItems 1
   */
  conditions: ActionParameter[];
  /**
   * Parameters for action. Must match action definition.
   * @minItems 1
   */
  parameters: ActionParameter[];
  /** Display value for this action. Will be mapped to each action on errands */
  displayValue?: string;
}

/** Label model */
export interface Label {
  /** Label ID */
  id?: string;
  /**
   * Label version for optimistic concurrency control
   * @format int64
   */
  version?: number;
  /**
   * Label classification
   * @minLength 1
   */
  classification: string;
  /** Display name for the label */
  displayName?: string;
  /** Resource path */
  resourcePath?: string;
  /**
   * Resource name
   * @minLength 1
   * @pattern [A-Z0-9_]+
   */
  resourceName: string;
  /**
   * Indicates if the label is deprecated
   * @default false
   */
  deprecated?: boolean;
  labels?: Label[];
  /** Free-form key/value data owned by the client. Stored and returned as-is by the service, which does not interpret the contents (apart from rejecting duplicate keys per label). Keys are conventions agreed between clients (e.g. 'escalationEmail'). */
  attributes?: LabelAttribute[];
}

/** Label attribute model. Free-form key/value data owned by the client; not interpreted by the service. Keys are conventions agreed between clients (e.g. 'escalationEmail'). */
export interface LabelAttribute {
  /**
   * Attribute key
   * @minLength 1
   */
  key: string;
  /**
   * Attribute value
   * @minLength 1
   */
  value: string;
}

/** Message exchange worker config model */
export interface MessageExchangeIntegration {
  /** Status on errand that will trigger a status change when a new incoming message refers to an existing errand */
  triggerStatusChangeOn?: string | null;
  /** Status that will be set on errand if status change is triggered. Can only be null if 'triggerStatusChangeOn' is null. */
  statusChangeTo?: string | null;
  /**
   * Timestamp when the configuration was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the configuration was last modified
   * @format date-time
   */
  modified?: string;
}

export interface JsonNode {
  empty?: boolean;
  array?: boolean;
  null?: boolean;
  object?: boolean;
  float?: boolean;
  number?: boolean;
  string?: boolean;
  boolean?: boolean;
  missingNode?: boolean;
  pojo?: boolean;
  /** @deprecated */
  textual?: boolean;
  binary?: boolean;
  valueNode?: boolean;
  container?: boolean;
  floatingPointNumber?: boolean;
  short?: boolean;
  int?: boolean;
  long?: boolean;
  double?: boolean;
  bigDecimal?: boolean;
  bigInteger?: boolean;
  nodeType?: JsonNodeNodeTypeEnum;
  integralNumber?: boolean;
  embeddedValue?: boolean;
}

/** JSON Parameter model */
export interface JsonParameter {
  /**
   * Parameter key/name
   * @minLength 1
   */
  key: string;
  /**
   * JSON structure value
   * @example {"firstName":"Joe","lastName":"Doe"}
   */
  value: JsonNode;
  /**
   * ID referencing a schema in the json-schema service
   * @minLength 1
   */
  schemaId: string;
  /**
   * Optimistic locking version of the JSON parameter
   * @format int64
   */
  version?: number;
}

/** Email integration config model */
export interface EmailIntegration {
  /** If set to true emails will be fetched */
  enabled: boolean;
  /** Email sender if incoming mail is rejected */
  errandClosedEmailSender?: string | null;
  /** Message that will be sent when incoming mail is rejected */
  errandClosedEmailTemplate?: string | null;
  /** HTML template for email that will be sent when incoming mail is rejected */
  errandClosedEmailHTMLTemplate?: string | null;
  /** Email sender if incoming mail results in new errand */
  errandNewEmailSender?: string | null;
  /** Message that will be sent when new errand is created */
  errandNewEmailTemplate?: string | null;
  /** HTML template for email that will be sent when incoming mail results in new errand */
  errandNewEmailHTMLTemplate?: string | null;
  /**
   * Number of days before incoming mail is rejected. Measured from when the errand was last touched. Rejection can only occur if status on errand equals 'inactiveStatus'.
   * @format int32
   */
  daysOfInactivityBeforeReject?: string | null;
  /** Status set on errand when email results in a new errand */
  statusForNew: string;
  /** Status on errand that will trigger a status change when email refers to an existing errand */
  triggerStatusChangeOn?: string | null;
  /** Status that will be set on errand if status change is triggered. Can only be null if 'triggerStatusChangeOn' is null. */
  statusChangeTo?: string | null;
  /** Status of an inactive errand. This value relates to property 'daysOfInactivityBeforeReject'. If set to null, no rejection mail will be sent */
  inactiveStatus?: string | null;
  /** If true sender is added as stakeholder */
  addSenderAsStakeholder?: string | null;
  /** Role set on stakeholder. */
  stakeholderRole?: string | null;
  /** Channel set on created errands */
  errandChannel?: string | null;
  /** If true, auto-reply emails (with Auto-Submitted header) will be ignored and not processed, except for delivery-status reports */
  ignoreAutoReply: boolean;
  /** If true, no confirmation email will be sent to no-reply addresses */
  ignoreNoReply: boolean;
  /**
   * Timestamp when the configuration was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the configuration was last modified
   * @format date-time
   */
  modified?: string;
}

/** Message-Exchange sync configuration */
export interface MessageExchangeSync {
  /**
   * Unique id
   * @format int64
   */
  id?: number;
  /** Message exchange namespace to search in. Does not map to supporManagement namespace. */
  namespace?: string;
  /**
   * Latest synced sequence number
   * @format int64
   */
  latestSyncedSequenceNumber?: number;
  /**
   * Timestamp when the configuration was last modified
   * @format date-time
   */
  modified?: string;
  /** If set to true conversations will be synced */
  active: boolean;
}

/** Filter on event type/subtype, used to limit which eventlog events trigger a notification */
export interface EventFilter {
  /**
   * Event type. Matches the eventlog EventType enum.
   * @minLength 1
   * @pattern ^(CREATE|READ|UPDATE|DELETE|ACCESS|EXECUTE|CANCEL|DROP)$
   */
  type: EventFilterTypeEnum;
  /**
   * Event subtype. If null, all subtypes of the given type match.
   * @minLength 0
   * @maxLength 64
   */
  subtype?: string;
}

/** Identifier describing a user or subject (AD-account or party-id) */
export interface Identifier {
  /**
   * Identifier type
   * @minLength 1
   * @pattern ^(adAccount|partyId)$
   */
  type: IdentifierTypeEnum;
  /**
   * Identifier value (AD-account name or partyId UUID)
   * @minLength 0
   * @maxLength 255
   */
  value: string;
}

/** Channel a subscriber wants to receive notifications on */
export interface NotificationChannel {
  /** Channel type */
  type: NotificationChannelTypeEnum;
  /**
   * Optional destination override (e.g. an alternative e-mail address or phone number). If omitted, the default destination derived from the subscriber's identifier is used.
   * @minLength 0
   * @maxLength 255
   */
  destination?: string;
}

/** A subscriber describes who receives notifications, which channels they prefer, and which event types they are interested in. */
export interface Subscriber {
  /** Unique identifier of the subscriber */
  id?: string;
  /**
   * Optional human-readable label. Useful when a person has several subscribers (e.g. one per role or purpose).
   * @minLength 0
   * @maxLength 255
   */
  name?: string;
  /** Identifier of the principal that ultimately receives notifications (AD-account or partyId). Immutable once created. */
  identifier?: Identifier;
  /** Channels the subscriber wants to receive notifications on. If empty, defaults to INTERNAL. */
  channels?: NotificationChannel[];
  /** Event filters that restrict which eventlog events trigger notifications. If empty, all events match. */
  eventFilters?: EventFilter[];
  /**
   * When the subscriber's notifications are paused from (inclusive). Null means not paused.
   * @format date-time
   */
  pausedFrom?: string;
  /**
   * When the subscriber's notifications resume (exclusive). Null means paused indefinitely (only meaningful if pausedFrom is set).
   * @format date-time
   */
  pausedUntil?: string;
  /**
   * Timestamp when the subscriber was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the subscriber was last modified
   * @format date-time
   */
  modified?: string;
  /** Identifier of the principal that created the subscriber */
  createdBy?: Identifier;
  /**
   * Number of subscriptions currently owned by this subscriber
   * @format int32
   */
  subscriptionCount?: number;
}

/** A subscription describes what a subscriber is listening for (an errand or all events in a namespace). Subscriptions support create and delete only — to change what is being listened to, delete and create a new one. */
export interface Subscription {
  /** Unique identifier of the subscription */
  id?: string;
  /** What this subscription targets (an errand or the whole namespace). */
  target?: SubscriptionTarget;
  /** Optional per-subscription override of the subscriber-level event filters. When set, these filters apply to events matched by this subscription instead of the subscriber's global filters. When null or empty, the subscriber-level filters are used as-is. */
  eventFilters?: EventFilter[];
  /**
   * Optional expiration timestamp. After this point the subscription is eligible for automatic cleanup.
   * @format date-time
   */
  expiresAt?: string;
  /**
   * Timestamp when the subscription was created
   * @format date-time
   */
  created?: string;
  /** Identifier of the principal that created the subscription (may differ from the owning subscriber, e.g. when an admin subscribes on behalf of someone else). */
  createdBy?: Identifier;
}

/** What a subscription targets. The id field is required when type=ERRAND and ignored when type=NAMESPACE. */
export interface SubscriptionTarget {
  /** Target type */
  type: SubscriptionTargetTypeEnum;
  /** Identifier of the target. Required (errand UUID) when type=ERRAND. Must be null when type=NAMESPACE. */
  id?: string;
}

/** Status model */
export interface Status {
  /** Status ID */
  id?: string;
  /**
   * Name for the status
   * @minLength 1
   */
  name: string;
  /** Display name for the status */
  displayName?: string | null;
  /** External display name for the status */
  externalDisplayName?: string | null;
  /**
   * Sort order for the status
   * @format int32
   */
  sortOrder?: number | null;
  /**
   * Indicates if the status is deprecated
   * @default false
   */
  deprecated?: boolean;
  /**
   * Timestamp when the status was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the status was last modified
   * @format date-time
   */
  modified?: string;
}

/** Role model */
export interface Role {
  /** Role ID */
  id?: string;
  /**
   * Name for the role. Used as key
   * @minLength 1
   */
  name: string;
  /** Display name for the role */
  displayName?: string | null;
  /**
   * Sort order for the role
   * @format int32
   */
  sortOrder?: number | null;
  /**
   * Indicates if the role is deprecated
   * @default false
   */
  deprecated?: boolean;
  /**
   * Timestamp when the role was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the role was last modified
   * @format date-time
   */
  modified?: string;
}

/** Phase model */
export interface Phase {
  /** Phase ID */
  id?: string;
  /**
   * Phase name
   * @minLength 1
   */
  name: string;
  /** Display name for the phase */
  displayName?: string;
  /** Description of the phase */
  description?: string;
  /**
   * Order of the phase in the process (0 = initial phase)
   * @format int32
   */
  phaseOrder?: number;
  /** Allowed statuses in this phase */
  allowedStatuses?: string[];
  /** Transitions from this phase */
  transitions?: PhaseTransition[];
  /**
   * Indicates if the phase is deprecated
   * @default false
   */
  deprecated?: boolean;
  /**
   * Timestamp when the phase was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the phase was last modified
   * @format date-time
   */
  modified?: string;
}

/** Phase transition model */
export interface PhaseTransition {
  /** Transition ID */
  id?: string;
  /**
   * Target phase ID
   * @minLength 1
   */
  targetPhaseId: string;
  /** Target phase name */
  targetPhaseName?: string;
  /** Target phase display name */
  targetPhaseDisplayName?: string;
  /** Description of the transition */
  description?: string;
  /**
   * Indicates if the phase transition is deprecated
   * @default false
   */
  deprecated?: boolean;
}

/** MeasureType model */
export interface MeasureType {
  /** MeasureType ID */
  id?: string;
  /**
   * Name for the measure type. Used as key
   * @minLength 1
   */
  name: string;
  /** Display name for the measure type */
  displayName?: string | null;
  /**
   * Group that this measure type belongs to
   * @minLength 1
   */
  measureGroup: string;
  /**
   * Sort order for the measure type
   * @format int32
   */
  sortOrder?: number | null;
  /**
   * Indicates if the measure type is deprecated
   * @default false
   */
  deprecated?: boolean;
  /**
   * Timestamp when the measure type was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the measure type was last modified
   * @format date-time
   */
  modified?: string;
}

/** ExternalIdType model */
export interface ExternalIdType {
  /** ExternalIdType ID */
  id?: string;
  /**
   * Name for the external id type
   * @minLength 1
   */
  name: string;
  /** Display name for the external id type */
  displayName?: string | null;
  /**
   * Sort order for the external id type
   * @format int32
   */
  sortOrder?: number | null;
  /**
   * Indicates if the external ID type is deprecated
   * @default false
   */
  deprecated?: boolean;
  /**
   * Timestamp when the external id type was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the external id type was last modified
   * @format date-time
   */
  modified?: string;
}

/** Contact reason model */
export interface ContactReason {
  /** ID */
  id?: string;
  /**
   * Reason for contact
   * @minLength 1
   */
  reason: string;
  /** Display name for the contact reason */
  displayName?: string | null;
  /**
   * Sort order for the contact reason
   * @format int32
   */
  sortOrder?: number | null;
  /**
   * Indicates if the contact reason is deprecated
   * @default false
   */
  deprecated?: boolean;
  /**
   * Timestamp when the contact reason was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the contact reason was last modified
   * @format date-time
   */
  modified?: string;
}

/** Category model */
export interface Category {
  /** Category ID */
  id?: string;
  /** Name for the category */
  name?: string;
  /** Display name for the category */
  displayName?: string;
  /**
   * Sort order for the category
   * @format int32
   */
  sortOrder?: number | null;
  /**
   * Indicates if the category is deprecated
   * @default false
   */
  deprecated?: boolean;
  /** @uniqueItems true */
  types?: Type[];
  /**
   * Timestamp when the category was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the category was last modified
   * @format date-time
   */
  modified?: string;
}

/** Type model */
export interface Type {
  /**
   * Name for the type
   * @minLength 1
   */
  name: string;
  /** Display name for the type */
  displayName?: string;
  /**
   * Email for where to escalate the errand if needed
   * @format email
   */
  escalationEmail?: string;
  /**
   * Indicates if the type is deprecated
   * @default false
   */
  deprecated?: boolean;
  /**
   * Timestamp when type was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when type was last modified
   * @format date-time
   */
  modified?: string;
}

/** Classification model */
export interface Classification {
  /** Category for the errand */
  category?: string;
  /** Type of errand */
  type?: string;
}

/** Contact channel model */
export interface ContactChannel {
  /** Type of channel. Defines how value is interpreted */
  type?: string;
  /** Value for Contact channel */
  value?: string;
}

/** Errand model */
export interface Errand {
  /** Unique id for the errand */
  id?: string;
  /** Unique number for the errand */
  errandNumber?: string;
  /** Title for the errand */
  title?: string;
  /** Priority model */
  priority?: Priority;
  stakeholders?: Stakeholder[];
  /** @uniqueItems true */
  externalTags?: ExternalTag[];
  /** Parameters for the errand */
  parameters?: Parameter[];
  /** JSON parameters for the errand */
  jsonParameters?: JsonParameter[];
  /** Classification model */
  classification?: Classification;
  /** Status for the errand */
  status?: string;
  /** Resolution status for closed errands. Value can be set to anything */
  resolution?: string;
  /** Errand description text */
  description?: string;
  /**
   * The channel from which the errand originated
   * @maxLength 255
   */
  channel?: string;
  /** User id for the person which has created the errand */
  reporterUserId?: string;
  /** Id for the user which currently is assigned to the errand if a user is assigned */
  assignedUserId?: string;
  /** Id for the group which is currently assigned to the errand if a group is assigned */
  assignedGroupId?: string;
  /**
   * Email address used for escalation of errand
   * @format email
   */
  escalationEmail?: string;
  /** Contact reason for the errand */
  contactReason?: string;
  /**
   * Contact reason description for the errand
   * @maxLength 4096
   */
  contactReasonDescription?: string;
  /** Suspension information */
  suspension?: Suspension;
  /** Flag to indicate if the errand is business related */
  businessRelated?: boolean;
  /** List of labels for the errand */
  labels?: ErrandLabel[];
  /** Phase history for the errand */
  phases?: ErrandPhase[];
  /** Phase metadata ID to assign as the active phase on the errand */
  activePhaseId?: string;
  /** List of active notifications for the errand */
  activeNotifications?: Notification[];
  /** List of pending actions for the errand */
  actions?: ErrandAction[];
  /** List of measures for the errand */
  measures?: Measure[];
  /**
   * Timestamp when errand was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when errand was last modified
   * @format date-time
   */
  modified?: string;
  /**
   * Timestamp when errand was last touched (created or modified)
   * @format date-time
   */
  touched?: string;
  /**
   * Optimistic locking version of the errand
   * @format int64
   */
  version?: number;
}

/** Errand action model */
export interface ErrandAction {
  /** Unique id for the action */
  id?: string;
  /** Name of the action */
  actionName?: string;
  /**
   * Timestamp after which the action should be executed
   * @format date-time
   */
  executeAfter?: string;
  /** Id of the action config that created this action */
  actionConfigId?: string;
  /** Display value for the action */
  displayValue?: string;
}

/** Errand label model */
export interface ErrandLabel {
  /** Label ID */
  id?: string;
  /**
   * Label version for optimistic concurrency control. When set, validated against the current version in DB on errand create/update — mismatch yields 412.
   * @format int64
   */
  version?: number;
  /** Label classification */
  classification?: string;
  /** Display name for the label */
  displayName?: string;
  /** Resource path */
  resourcePath?: string;
  /** Resource name */
  resourceName?: string;
}

/** Errand phase model */
export interface ErrandPhase {
  /** Phase metadata ID */
  phaseId?: string;
  /** Phase name */
  name?: string;
  /** Phase display name */
  displayName?: string;
  /**
   * Timestamp when the errand entered this phase
   * @format date-time
   */
  started?: string;
  /**
   * Timestamp when the errand left this phase
   * @format date-time
   */
  ended?: string;
}

/** External tag model */
export interface ExternalTag {
  /** Key for external tag */
  key?: string;
  /** Value for external tag */
  value?: string;
}

/** Measure model */
export interface Measure {
  /** Measure ID */
  id?: string;
  /** Responsible user (ad-username) */
  responsibleUser?: string;
  /** Type of measure */
  type?: string;
  /**
   * Planned start date
   * @format date-time
   */
  plannedStart?: string;
  /**
   * Planned completion date
   * @format date-time
   */
  plannedComplete?: string;
  /**
   * Execution date
   * @format date-time
   */
  executed?: string;
  /** User who added the measure */
  addedByUser?: string;
  /** Role of the user who added the measure */
  addedByRole?: string;
  /** Goal of the measure */
  goal?: string;
  /** Description of the measure */
  description?: string;
  /** Accept status */
  accept?: string | null;
  /** Motivation for the accept decision */
  acceptMotivation?: string;
  /** Rework goal */
  reworkGoal?: string;
  /** Rework description */
  reworkDescription?: string;
  /**
   * Timestamp when the measure was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the measure was last modified
   * @format date-time
   */
  modified?: string;
}

export interface Notification {
  /** Unique identifier for the notification */
  id?: string;
  /**
   * Timestamp when the notification was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the notification was last modified
   * @format date-time
   */
  modified?: string;
  /** Name of the owner of the notification */
  ownerFullName?: string;
  /** Owner id of the notification */
  ownerId?: string;
  /** User who created the notification */
  createdBy?: string;
  /** Full name of the user who created the notification */
  createdByFullName?: string;
  /** Type of the notification */
  type?: string;
  /** Subtype of the notification */
  subtype?: string;
  /** Description of the notification */
  description?: string;
  /** Content of the notification */
  content?: string;
  /**
   * Timestamp when the notification expires
   * @format date-time
   */
  expires?: string;
  /** Acknowledged status of the notification (global level). I.e. this notification is acknowledged by anyone. */
  globalAcknowledged?: boolean;
  /** Acknowledged status of the notification (owner level). I.e. this notification is acknowledged by the owner of this notification. */
  acknowledged?: boolean;
  /** Errand id of the notification */
  errandId?: string;
  /** Errand number of the notification */
  errandNumber?: string;
}

/** Parameter model */
export interface Parameter {
  /**
   * Parameter key
   * @minLength 1
   */
  key: string;
  /** Parameter display name */
  displayName?: string;
  /** Parameter group name */
  group?: string;
  /** Parameter values. Each value can have a maximum length of 3000 characters */
  values?: string[];
  /**
   * Optimistic locking version of the parameter
   * @format int64
   */
  version?: number;
}

/** Stakeholder model */
export interface Stakeholder {
  /** Unique identifier (partyId) for the stakeholder. Must be null or a valid UUID. */
  externalId?: string;
  /** Type of external id */
  externalIdType?: string;
  /** Role of stakeholder */
  role?: string;
  /** City */
  city?: string;
  /** Organization name */
  organizationName?: string;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** Address */
  address?: string;
  /** Care of */
  careOf?: string;
  /** Zip code */
  zipCode?: string;
  /** Country */
  country?: string;
  contactChannels?: ContactChannel[];
  /** Parameters for the stakeholder */
  parameters?: Parameter[];
}

export interface Suspension {
  /**
   * Timestamp when the suspension wears off
   * @format date-time
   */
  suspendedTo?: string;
  /**
   * Timestamp when the suspension started
   * @format date-time
   */
  suspendedFrom?: string;
}

/** CreateErrandNoteRequest model */
export interface CreateErrandNoteRequest {
  /**
   * Context for note
   * @minLength 1
   * @maxLength 255
   */
  context: string;
  /**
   * Role of note creator
   * @minLength 1
   * @maxLength 255
   */
  role: string;
  /** Party id (e.g. a personId or an organizationId) */
  partyId?: string;
  /**
   * The note subject
   * @minLength 1
   * @maxLength 255
   */
  subject: string;
  /**
   * The note body
   * @minLength 1
   * @maxLength 2048
   */
  body: string;
  /**
   * Created by
   * @minLength 1
   */
  createdBy: string;
}

/** Request describing which namespace a source errand should be previewed for handover to */
export interface HandoverPreviewRequest {
  /**
   * Namespace the errand should be handed over to
   * @minLength 1
   * @pattern [\w|\-]+
   */
  targetNamespace: string;
  /** Municipality id the errand should be handed over to */
  targetMunicipalityId: string;
}

/** Mapping suggestion for the namespace-bound classification (category/type) field */
export interface ClassificationMapping {
  /** Classification on the source errand */
  source?: ClassificationOption;
  /** Auto-suggested target category name, or null if no match was found */
  suggestedCategory?: string;
  /** Auto-suggested target type name, or null if no match was found */
  suggestedType?: string;
  /** Selectable types per category in the target namespace. Always present, may be empty */
  candidates: Record<string, string[]>;
}

/** A category/type pair describing an errand classification */
export interface ClassificationOption {
  /** Category name */
  category?: string;
  /** Type name */
  type?: string;
}

/** Mapping suggestion for the namespace-bound contact reason field */
export interface ContactReasonMapping {
  /** Contact reason on the source errand */
  source?: string;
  /** Auto-suggested target contact reason, or null if no match was found */
  suggested?: string;
  /** All selectable contact reasons in the target namespace. Always present, may be empty */
  candidates: string[];
}

/** Fields that are copied automatically to the target namespace without manual mapping */
export interface DirectlyCopyable {
  /** Title of the source errand */
  title?: string;
  /** Priority of the source errand */
  priority?: Priority;
  /**
   * Number of stakeholders that will be copied
   * @format int32
   */
  stakeholderCount?: number;
  /**
   * Number of external tags that will be copied
   * @format int32
   */
  externalTagCount?: number;
  /**
   * Number of attachments that will be copied
   * @format int32
   */
  attachmentCount?: number;
}

/** Preview of how a source errand would be handed over to another namespace, without any side effects */
export interface HandoverPreview {
  /** Fields that are copied automatically */
  directlyCopyable?: DirectlyCopyable;
  /** Namespace-bound fields that require manual mapping */
  mappingRequired?: MappingRequired;
  /** Options for handling the source errand after handover. Always present */
  sourceHandling: SourceHandling;
  /** Fields that can not be copied to the target namespace. Always present, may be empty */
  notCopyable: NotCopyable[];
  /** Warnings raised while building the preview. Always present, may be empty */
  warnings: Warning[];
}

/** A label that can be chosen as the target for a source label */
export interface LabelCandidate {
  /** Unique id of the label in the target namespace */
  id?: string;
  /** Display name of the label */
  displayName?: string;
  /** Hierarchical resource path of the label */
  resourcePath?: string;
}

/** Mapping suggestion for a single namespace-bound label */
export interface LabelMapping {
  /** Unique id of the label on the source errand */
  sourceId?: string;
  /** Display name of the source label */
  sourceDisplayName?: string;
  /** Hierarchical resource path of the source label */
  sourceResourcePath?: string;
  /** Auto-suggested target label id, or null if no match was found */
  suggestedTargetId?: string;
  /** Reason the target was suggested, or null if there is no suggestion */
  matchReason?: MatchReason;
}

/** Label mapping section: the selectable target labels shared by every mapping, plus one mapping suggestion per source label */
export interface LabelMappingGroup {
  /** All selectable labels in the target namespace, shared by every mapping. Always present, may be empty */
  candidates: LabelCandidate[];
  /** Mapping suggestions, one entry per source label. Always present, may be empty */
  mappings: LabelMapping[];
}

/** Namespace-bound fields that require a human to decide how they should be mapped to the target namespace */
export interface MappingRequired {
  /** Status mapping suggestion */
  status?: StatusMapping;
  /** Classification (category/type) mapping suggestion */
  classification?: ClassificationMapping;
  /** Label mapping section: the selectable target labels plus one mapping suggestion per source label. Always present */
  labels: LabelMappingGroup;
  /** Contact reason mapping suggestion */
  contactReason?: ContactReasonMapping;
}

/** A selectable metadata option identified by its technical name and display name */
export interface MetadataOption {
  /** Technical name of the option */
  name?: string;
  /** Human readable display name of the option */
  displayName?: string;
}

/** A field that can not be copied to the target namespace */
export interface NotCopyable {
  /** Name of the field that can not be copied */
  field?: string;
  /** Reason the field can not be copied */
  reason?: string;
}

/** Options for handling the source errand after handover */
export interface SourceHandling {
  /** Selectable statuses in the source namespace, used when choosing how the source errand is handled after handover. Always present, may be empty */
  statusCandidates: MetadataOption[];
}

/** Mapping suggestion for the namespace-bound status field */
export interface StatusMapping {
  /** Status on the source errand */
  source?: MetadataOption;
  /** Auto-suggested target status name, or null if no match was found */
  suggestedTarget?: string;
  /** Reason the target was suggested, or null if there is no suggestion */
  matchReason?: MatchReason;
  /** All selectable statuses in the target namespace. Always present, may be empty */
  candidates: MetadataOption[];
}

/** A warning raised while building the handover preview. The applicable fields depend on 'type' */
export interface Warning {
  /** Type of warning, acts as discriminator for which other fields are populated */
  type: WarningType;
  /** Key the warning relates to. Populated for PARAMETER_SCHEMA_MISMATCH */
  key?: string;
  /** Human readable detail describing the warning. Populated for PARAMETER_SCHEMA_MISMATCH */
  detail?: string;
  /** Value the warning relates to. Populated for ROLE_NOT_IN_TARGET */
  value?: string;
}

/** Request body for handing over an errand to another namespace */
export interface HandoverErrandRequest {
  /** Target system to handover the errand to */
  target: HandoverTarget;
  /** Field mappings to apply when creating the errand in the target system */
  mapping: HandoverMapping;
  /** Field values that override what is copied from the source errand */
  overrides?: HandoverOverrides;
  /** Flags controlling what data is copied from the source errand */
  include?: HandoverInclude;
  /** Defines what happens to the source errand after handover */
  sourceHandling?: HandoverSourceHandling;
}

/** Flags controlling what data is copied from the source errand */
export interface HandoverInclude {
  /**
   * Include stakeholders
   * @default false
   */
  stakeholders?: boolean;
  /**
   * Include external tags
   * @default false
   */
  externalTags?: boolean;
  /**
   * Include parameters
   * @default false
   */
  parameters?: boolean;
  /**
   * Include JSON parameters
   * @default false
   */
  jsonParameters?: boolean;
  /**
   * Include attachments
   * @default false
   */
  attachments?: boolean;
  /**
   * Include business related flag
   * @default false
   */
  businessRelated?: boolean;
  /**
   * Include escalation email
   * @default false
   */
  escalationEmail?: boolean;
  /**
   * Include contact reason description
   * @default false
   */
  contactReasonDescription?: boolean;
}

/** Field mappings to apply when creating the errand in the target system */
export interface HandoverMapping {
  /**
   * Status to set on the new errand
   * @example "NEW_CASE"
   */
  status?: string;
  /** Classification model */
  classification?: Classification;
  /** Label UUIDs to apply on the new errand */
  labels?: string[];
  /**
   * Contact reason to set on the new errand
   * @example "Printer issue"
   */
  contactReason?: string;
  /**
   * Channel to set on the new errand
   * @example "WEB_UI"
   */
  channel?: string;
}

/** Field values that override what is copied from the source errand */
export interface HandoverOverrides {
  /** Title override */
  title?: string;
  /** Description override */
  description?: string;
  /** Priority model */
  priority?: Priority;
  /** Assigned user id override */
  assignedUserId?: string;
  /** Assigned group id override */
  assignedGroupId?: string;
}

/** Defines what happens to the source errand after handover */
export interface HandoverSourceHandling {
  /** Action to take on the source errand after handover */
  action: HandoverSourceAction;
  /**
   * Status to set on the source errand
   * @example "SOLVED"
   */
  status?: string;
  /**
   * Resolution to set on the source errand
   * @example "HANDED_OVER"
   */
  resolution?: string;
  /**
   * Closing comment to add to the source errand
   * @example "Överlämnad till annan drake"
   */
  closingComment?: string;
}

/** Target system to handover the errand to */
export interface HandoverTarget {
  /**
   * Target namespace
   * @minLength 1
   * @example "OTHER_NAMESPACE"
   */
  namespace: string;
  /**
   * Target municipality id
   * @example "2281"
   */
  municipalityId?: string;
}

/** Response body for a successful errand handover */
export interface HandoverErrand {
  /**
   * Id of the newly created errand in the target system
   * @example "f0882f1d-06bc-47fd-b017-1d8307f5ce95"
   */
  newErrandId?: string;
  /**
   * Errand number of the newly created errand
   * @example "KC-23010001"
   */
  newErrandNumber?: string;
  /** Target namespace and municipality the errand was handed over to */
  target?: HandoverTarget;
  /** Id of the relation created between the source and target errand */
  relationId?: string;
  /** Field mappings that were applied when creating the new errand */
  appliedMappings?: Record<string, string>;
  /** Non-fatal warnings that occurred during handover */
  warnings?: string[];
}

/** WebMessageAttachment model */
export interface WebMessageAttachment {
  /**
   * The attachment file name
   * @minLength 1
   */
  fileName: string;
  /**
   * The attachment (file) content as a BASE64-encoded string, max size 50 MB
   * @format base64
   */
  base64EncodedString: string;
}

/** WebMessageRequest model */
export interface WebMessageRequest {
  /** Indicates if the message is internal */
  internal?: boolean;
  /**
   * Indicates if the message should be dispatched with messaging or not
   * @default true
   */
  dispatch?: boolean;
  /**
   * Message in plain text
   * @minLength 1
   */
  message: string;
  attachments?: WebMessageAttachment[];
  attachmentIds?: string[];
}

/** SmsRequest model */
export interface SmsRequest {
  /**
   * The sender of the SMS
   * @minLength 1
   * @maxLength 11
   */
  sender: string;
  /** Mobile number to recipient in format +467[02369]\d{7} */
  recipient: string;
  /**
   * Message
   * @minLength 1
   */
  message: string;
  /** Indicates if the message is internal */
  internal?: boolean;
}

/** EmailAttachment model */
export interface EmailAttachment {
  /**
   * The attachment file name
   * @minLength 1
   */
  fileName: string;
  /**
   * The attachment (file) content as a BASE64-encoded string, max size 50 MB
   * @format base64
   */
  base64EncodedString: string;
}

/** EmailRequest model */
export interface EmailRequest {
  /**
   * Email address for sender
   * @format email
   */
  sender: string;
  /** Optional display name of sender on email. If left out, email will be displayed as sender name. */
  senderName?: string;
  /**
   * Email address for recipient
   * @format email
   */
  recipient: string;
  /**
   * Subject
   * @minLength 1
   */
  subject: string;
  /**
   * Message in html (optionally in BASE64 encoded format)
   * @minLength 1
   */
  htmlMessage: string;
  /**
   * Message in plain text
   * @minLength 1
   */
  message: string;
  /** Indicates if the message is internal */
  internal?: boolean;
  /** Headers for keeping track of email conversations */
  emailHeaders?: Record<string, string[]>;
  attachments?: EmailAttachment[];
  attachmentIds?: string[];
}

/** ConversationRequest model */
export interface ConversationRequest {
  /**
   * The message-exchange topic
   * @minLength 1
   */
  topic: string;
  /** The conversation type */
  type: ConversationType;
  relationIds?: string[];
  participants?: Identifier[];
  metadata?: KeyValues[];
}

/** KeyValues model */
export interface KeyValues {
  /** The key */
  key?: string;
  values?: string[];
}

/** MessageRequest model */
export interface MessageRequest {
  /** The ID of the replied message */
  inReplyToMessageId?: string;
  /**
   * The content of the message.
   * @minLength 1
   */
  content: string;
  attachmentIds?: string[];
}

/** MarkAsReadRequest model */
export interface MarkAsReadRequest {
  /** @minItems 1 */
  messageIds: string[];
}

/** Errand purge request model */
export interface ErrandPurgeRequest {
  /**
   * Errands last touched before this point in time are purged
   * @format date-time
   */
  olderThan: string;
  /** When true, the run only counts the errands that would be purged and deletes nothing */
  dryRun: boolean;
  /**
   * Highest number of errands to handle in this run. Unlimited when omitted.
   * @format int32
   * @min 1
   */
  maxErrands?: number;
}

/** Job response */
export interface JobResponse {
  /** Job ID */
  jobId?: string;
  /** Job type */
  type?: JobResponseTypeEnum;
  /** Job status */
  status?: JobResponseStatusEnum;
  /**
   * Progress percentage (0-100)
   * @format int32
   */
  progress?: number;
  /**
   * Total number of items to process
   * @format int32
   */
  total?: number;
  /**
   * Number of items processed so far
   * @format int32
   */
  processed?: number;
  /** Error message, populated on FAILED status */
  message?: string;
  /**
   * When the job was created
   * @format date-time
   */
  created?: string;
  /**
   * When the job was last updated
   * @format date-time
   */
  modified?: string;
}

/** Validation model */
export interface Validation {
  /** Type of metadata that the validation applies to */
  type?: ValidationTypeEnum;
  /** Signals if values of the type are validated against the metadata of the namespace when errands are created or updated */
  validated: boolean;
  /**
   * Timestamp when the validation was created
   * @format date-time
   */
  created?: string;
  /**
   * Timestamp when the validation was last modified
   * @format date-time
   */
  modified?: string;
}

/** UpdateErrandNoteRequest model */
export interface UpdateErrandNoteRequest {
  /**
   * The note subject
   * @minLength 1
   * @maxLength 255
   */
  subject: string;
  /**
   * The note body
   * @minLength 1
   * @maxLength 2048
   */
  body: string;
  /**
   * Modified by
   * @minLength 1
   */
  modifiedBy: string;
}

/** ErrandNote model */
export interface ErrandNote {
  /** Note ID */
  id?: string;
  /** Context for note */
  context?: string;
  /** Role of note creator */
  role?: string;
  /** Id of the client who is the owner of the note */
  clientId?: string;
  /** Party ID (e.g. a personId or an organizationId) */
  partyId?: string;
  /** The note subject */
  subject?: string;
  /** The note body */
  body?: string;
  /** Id for the case */
  caseId?: string;
  /** Created by */
  createdBy?: string;
  /** Modified by */
  modifiedBy?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /**
   * Modified timestamp
   * @format date-time
   */
  modified?: string;
}

/** Conversation model */
export interface Conversation {
  /** Conversation ID */
  id?: string;
  /** The message-exchange topic */
  topic?: string;
  /** The conversation type */
  type?: ConversationType;
  relationIds?: string[];
  participants?: Identifier[];
  metadata?: KeyValues[];
}

export interface PageSubscriberNotification {
  /** @format int32 */
  totalPages?: number;
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  size?: number;
  content?: SubscriberNotification[];
  /** @format int32 */
  number?: number;
  sort?: SortObject;
  pageable?: PageableObject;
  /** @format int32 */
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface PageableObject {
  /** @format int64 */
  offset?: number;
  sort?: SortObject;
  unpaged?: boolean;
  paged?: boolean;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface SortObject {
  empty?: boolean;
  unsorted?: boolean;
  sorted?: boolean;
}

export interface SubscriberNotification {
  /**
   * Unique identifier for the notification
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id?: string;
  /**
   * Timestamp when the notification was created
   * @format date-time
   * @example "2000-10-31T01:30:00.000+02:00"
   */
  created?: string;
  /**
   * Timestamp when the notification was last modified
   * @format date-time
   * @example "2000-10-31T01:30:00.000+02:00"
   */
  modified?: string;
  /**
   * Identifier type of the notification owner
   * @example "adAccount"
   */
  identifierType?: string;
  /**
   * Identifier value of the notification owner
   * @example "joe01doe"
   */
  identifierValue?: string;
  /**
   * ID of the errand this notification relates to
   * @example "f0882f1d-06bc-47fd-b017-1d8307f5ce95"
   */
  errandId?: string;
  /**
   * Number of the errand this notification relates to
   * @example "PRH-2022-000001"
   */
  errandNumber?: string;
  /**
   * Timestamp when the notification expires
   * @format date-time
   * @example "2000-10-31T01:30:00.000+02:00"
   */
  expires?: string;
  /**
   * Timestamp when the notification was acknowledged, null if not yet acknowledged
   * @format date-time
   * @example "2000-10-31T01:30:00.000+02:00"
   */
  acknowledged?: string;
  /** Events that have occurred on the errand since the notification was last acknowledged */
  events?: SubscriberNotificationEvent[];
}

export interface SubscriberNotificationEvent {
  /**
   * Timestamp when the event occurred
   * @format date-time
   * @example "2000-10-31T01:30:00.000+02:00"
   */
  created?: string;
  /**
   * Event type
   * @example "UPDATE"
   */
  eventType?: string;
  /**
   * Description of the event
   * @example "Bilaga har skapats"
   */
  description?: string;
  /**
   * Subtype describing what kind of entity the event refers to
   * @example "ATTACHMENT"
   */
  subType?: string;
}

/** Action definition model describing an available action and its conditions/parameters */
export interface ActionDefinition {
  /** Name of the action */
  name?: string;
  /** Description of the action */
  description?: string;
  /** Definitions of conditions for this action */
  conditionDefinitions?: Definition[];
  /** Definitions of parameters for this action */
  parameterDefinitions?: Definition[];
}

/** Definition of a condition or parameter for an action */
export interface Definition {
  /** Key for the definition */
  key?: string;
  /**
   * Whether this definition is mandatory
   * @default false
   */
  mandatory?: boolean;
  /** Description of the definition */
  description?: string;
  /** List of possible values for this definition */
  possibleValues?: PossibleValue[];
}

/** Possible value for an action definition parameter or condition */
export interface PossibleValue {
  /** The value */
  value?: string;
  /** Display name for the value */
  displayName?: string;
}

/** Labels model */
export interface Labels {
  labelStructure?: Label[];
}

/** MetadataResponse model */
export interface MetadataResponse {
  categories?: Category[];
  externalIdTypes?: ExternalIdType[];
  /** Labels model */
  labels?: Labels;
  statuses?: Status[];
  roles?: Role[];
  measureTypes?: MeasureType[];
  contactReasons?: ContactReason[];
  phases?: Phase[];
}

export interface PageErrand {
  /** @format int32 */
  totalPages?: number;
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  size?: number;
  content?: Errand[];
  /** @format int32 */
  number?: number;
  sort?: SortObject;
  pageable?: PageableObject;
  /** @format int32 */
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

/** Revision model */
export interface Revision {
  /** Unique id for the revision */
  id?: string;
  /** Unique id for the entity connected to the revision */
  entityId?: string;
  /** Type of entity for the revision */
  entityType?: string;
  /**
   * Version of the revision
   * @format int32
   */
  version?: number;
  /**
   * Timestamp when the revision was created
   * @format date-time
   */
  created?: string;
}

/** DifferenceResponse model */
export interface DifferenceResponse {
  operations?: Operation[];
}

/** Operation model */
export interface Operation {
  /** Type of operation */
  op?: string;
  /** Path to attribute */
  path?: string;
  /** Value of attribute */
  value?: string;
  /** Previous value of attribute */
  fromValue?: string;
}

/** FindErrandNotesRequest model */
export interface FindErrandNotesRequest {
  /**
   * Page number
   * @format int32
   * @min 1
   * @default 1
   */
  page?: number;
  /**
   * Result size per page
   * @format int32
   * @min 1
   * @max 1000
   * @default 100
   */
  limit?: number;
  /** Context for note */
  context?: string;
  /** Role of note creator */
  role?: string;
  /** Party id (e.g. a personId or an organizationId) */
  partyId?: string;
}

/** FindErrandNotesResponse model */
export interface FindErrandNotesResponse {
  notes?: ErrandNote[];
  /** Metadata model */
  _meta?: MetaData;
}

/** Metadata model */
export interface MetaData {
  /**
   * Current page
   * @format int32
   */
  page?: number;
  /**
   * Displayed objects per page
   * @format int32
   */
  limit?: number;
  /**
   * Displayed objects on current page
   * @format int32
   */
  count?: number;
  /**
   * Total amount of hits based on provided search parameters
   * @format int64
   */
  totalRecords?: number;
  /**
   * Total amount of pages based on provided search parameters
   * @format int32
   */
  totalPages?: number;
}

/** Event model */
export interface Event {
  /** Unique identifier for the event */
  id?: string;
  /** Type of event */
  type?: EventType;
  /** Subtype describing what kind of entity the event refers to */
  subType?: string;
  /** Groups related events and notifications together within one operation */
  requestGroupId?: string;
  /** Short event description */
  message?: string;
  /** Detailed event description */
  details?: string;
  /** Service that created event */
  owner?: string;
  /**
   * Timestamp when the event was created
   * @format date-time
   */
  created?: string;
  /** Reference to the snapshot of data at the time when the event was created */
  historyReference?: string;
  /** Source which the event refers to */
  sourceType?: string;
  metadata?: EventMetaData[];
}

/** Event Metadata model */
export interface EventMetaData {
  /** The key */
  key?: string;
  /** The value */
  value?: string;
}

export interface PageEvent {
  /** @format int32 */
  totalPages?: number;
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  size?: number;
  content?: Event[];
  /** @format int32 */
  number?: number;
  sort?: SortObject;
  pageable?: PageableObject;
  /** @format int32 */
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface Communication {
  /** The communication ID */
  communicationID?: string;
  /** Sender of the communication. */
  sender?: string;
  /** The errand number */
  errandNumber?: string;
  /** If the communication is inbound or outbound from the perspective of case-data/e-service. */
  direction?: CommunicationDirectionEnum;
  /** The message body */
  messageBody?: string;
  /** The message body in HTML format */
  htmlMessageBody?: string;
  /**
   * The time the communication was sent
   * @format date-time
   */
  sent?: string;
  /** The email-subject of the communication */
  subject?: string;
  /** The communication was delivered by */
  communicationType?: CommunicationCommunicationTypeEnum;
  /** The mobile number or email adress the communication was sent to */
  target?: string;
  /** The recipients of the communication, if email */
  recipients?: string[];
  /** The CC recipients of the communication, if email */
  ccRecipients?: string[];
  /** Indicates if the communication is internal */
  internal?: boolean;
  /** Signal if the communication has been viewed or not */
  viewed?: boolean;
  /** Headers for keeping track of email conversations */
  emailHeaders?: Record<string, string[]>;
  /** List of communicationAttachments on the message */
  communicationAttachments?: CommunicationAttachment[];
}

export interface CommunicationAttachment {
  /** The attachment ID */
  id?: string;
  /** The attachment file name */
  fileName?: string;
  /** The attachment MIME type */
  mimeType?: string;
}

/** Attachment model */
export interface Attachment {
  /** Attachment ID */
  id?: string;
  /** Name of the file */
  fileName?: string;
  /**
   * Size of the file in bytes
   * @format int32
   */
  fileSize?: number;
  /** Mime type of the file */
  mimeType?: string;
  /** Hash of the file content */
  hash?: string;
  /**
   * The attachment created date
   * @format date-time
   */
  created?: string;
}

/** Message model */
export interface Message {
  /** Message ID */
  id?: string;
  /** The ID of the replied message */
  inReplyToMessageId?: string;
  /**
   * The timestamp when the message was created.
   * @format date-time
   */
  created?: string;
  /** The participant who created the message. */
  createdBy?: Identifier;
  /** The content of the message. */
  content?: string;
  readBy?: ReadBy[];
  attachments?: Attachment[];
  /** Type of message (user or system created) */
  type?: MessageTypeEnum;
}

export interface PageMessage {
  /** @format int32 */
  totalPages?: number;
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  size?: number;
  content?: Message[];
  /** @format int32 */
  number?: number;
  sort?: SortObject;
  pageable?: PageableObject;
  /** @format int32 */
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

/** Readby model */
export interface ReadBy {
  /** The identifier of the person who read the message. */
  identifier?: Identifier;
  /**
   * The timestamp when the message was read.
   * @format date-time
   */
  readAt?: string;
}

/** Read-by statistics for a conversation */
export interface ConversationReadByCount {
  /**
   * The unique identifier of the conversation
   * @example "2af1002e-008f-4bdc-924b-daaae31f1118"
   */
  conversationId?: string;
  /**
   * Total number of messages in the conversation
   * @format int32
   */
  messageCount?: number;
  /** Per-identifier read count */
  readByCount?: ReadByCountEntry[];
  /** Per-part read count */
  readByPartCount?: PartReadByCountEntry[];
}

/** Read count for a specific part */
export interface PartReadByCountEntry {
  /**
   * The part that read the messages
   * @example "KC-23010001"
   */
  part?: string;
  /**
   * Number of messages read by this part
   * @format int32
   */
  count?: number;
}

/** Read count for a specific identifier */
export interface ReadByCountEntry {
  /** The identifier that read the messages */
  identifier?: Identifier;
  /**
   * Number of messages read by this identifier
   * @format int32
   */
  count?: number;
}

/** ErrandAttachment model */
export interface ErrandAttachment {
  /** Unique identifier for the attachment */
  id?: string;
  /** Name of the file */
  fileName?: string;
  /** Mime type of the file */
  mimeType?: string;
  /** The channel the attachment was received via */
  channel?: ErrandAttachmentChannelEnum;
  /**
   * The attachment created date
   * @format date-time
   */
  created?: string;
  /** SHA-256 hash (hex encoded) of the attachment's raw content */
  hash?: string;
}

export interface CountResponse {
  /** @format int64 */
  count?: number;
}

/** Field to expose */
export enum FieldAccessFieldEnum {
  ID = 'ID',
  ERRAND_NUMBER = 'ERRAND_NUMBER',
  TITLE = 'TITLE',
  STATUS = 'STATUS',
  RESOLUTION = 'RESOLUTION',
  CHANNEL = 'CHANNEL',
  CREATED = 'CREATED',
  MODIFIED = 'MODIFIED',
  TOUCHED = 'TOUCHED',
  PRIORITY = 'PRIORITY',
  DESCRIPTION = 'DESCRIPTION',
  CLASSIFICATION = 'CLASSIFICATION',
  REPORTER_USER_ID = 'REPORTER_USER_ID',
  ASSIGNED_USER_ID = 'ASSIGNED_USER_ID',
  ASSIGNED_GROUP_ID = 'ASSIGNED_GROUP_ID',
  BUSINESS_RELATED = 'BUSINESS_RELATED',
  SUSPENSION = 'SUSPENSION',
  CONTACT_REASON = 'CONTACT_REASON',
  CONTACT_REASON_DESCRIPTION = 'CONTACT_REASON_DESCRIPTION',
  ESCALATION_EMAIL = 'ESCALATION_EMAIL',
  LABELS = 'LABELS',
  STAKEHOLDERS = 'STAKEHOLDERS',
  MEASURES = 'MEASURES',
  ACTIVE_NOTIFICATIONS = 'ACTIVE_NOTIFICATIONS',
  VERSION = 'VERSION',
  PARAMETERS = 'PARAMETERS',
  JSON_PARAMETERS = 'JSON_PARAMETERS',
  EXTERNAL_TAGS = 'EXTERNAL_TAGS',
}

export enum LimitedReadAccessResourcesEnum {
  ERRAND = 'ERRAND',
  ATTACHMENT = 'ATTACHMENT',
  COMMUNICATION = 'COMMUNICATION',
  COMMUNICATION_ATTACHMENT = 'COMMUNICATION_ATTACHMENT',
  CONVERSATION = 'CONVERSATION',
  CONVERSATION_MESSAGE = 'CONVERSATION_MESSAGE',
  CONVERSATION_ATTACHMENT = 'CONVERSATION_ATTACHMENT',
  EVENT = 'EVENT',
  NOTE = 'NOTE',
  NOTE_REVISION = 'NOTE_REVISION',
  PARAMETER = 'PARAMETER',
  JSON_PARAMETER = 'JSON_PARAMETER',
  MEASURE = 'MEASURE',
  NOTIFICATION = 'NOTIFICATION',
  REVISION = 'REVISION',
  TIME_MEASURE = 'TIME_MEASURE',
  NAMESPACE_CONFIG = 'NAMESPACE_CONFIG',
  EMAIL_INTEGRATION_CONFIG = 'EMAIL_INTEGRATION_CONFIG',
  MESSAGE_EXCHANGE_INTEGRATION_CONFIG = 'MESSAGE_EXCHANGE_INTEGRATION_CONFIG',
  METADATA_CATEGORY = 'METADATA_CATEGORY',
  METADATA_CONTACT_REASON = 'METADATA_CONTACT_REASON',
  METADATA_EXTERNAL_ID_TYPE = 'METADATA_EXTERNAL_ID_TYPE',
  METADATA_LABEL = 'METADATA_LABEL',
  METADATA_MEASURE_TYPE = 'METADATA_MEASURE_TYPE',
  METADATA_PHASE = 'METADATA_PHASE',
  METADATA_ROLE = 'METADATA_ROLE',
  METADATA_STATUS = 'METADATA_STATUS',
  SUBSCRIBER = 'SUBSCRIBER',
  SUBSCRIPTION = 'SUBSCRIPTION',
  SUBSCRIBER_NOTIFICATION = 'SUBSCRIBER_NOTIFICATION',
}

/** Resource to grant access to */
export enum ResourceAccessResourceEnum {
  ERRAND = 'ERRAND',
  ATTACHMENT = 'ATTACHMENT',
  COMMUNICATION = 'COMMUNICATION',
  COMMUNICATION_ATTACHMENT = 'COMMUNICATION_ATTACHMENT',
  CONVERSATION = 'CONVERSATION',
  CONVERSATION_MESSAGE = 'CONVERSATION_MESSAGE',
  CONVERSATION_ATTACHMENT = 'CONVERSATION_ATTACHMENT',
  EVENT = 'EVENT',
  NOTE = 'NOTE',
  NOTE_REVISION = 'NOTE_REVISION',
  PARAMETER = 'PARAMETER',
  JSON_PARAMETER = 'JSON_PARAMETER',
  MEASURE = 'MEASURE',
  NOTIFICATION = 'NOTIFICATION',
  REVISION = 'REVISION',
  TIME_MEASURE = 'TIME_MEASURE',
  NAMESPACE_CONFIG = 'NAMESPACE_CONFIG',
  EMAIL_INTEGRATION_CONFIG = 'EMAIL_INTEGRATION_CONFIG',
  MESSAGE_EXCHANGE_INTEGRATION_CONFIG = 'MESSAGE_EXCHANGE_INTEGRATION_CONFIG',
  METADATA_CATEGORY = 'METADATA_CATEGORY',
  METADATA_CONTACT_REASON = 'METADATA_CONTACT_REASON',
  METADATA_EXTERNAL_ID_TYPE = 'METADATA_EXTERNAL_ID_TYPE',
  METADATA_LABEL = 'METADATA_LABEL',
  METADATA_MEASURE_TYPE = 'METADATA_MEASURE_TYPE',
  METADATA_PHASE = 'METADATA_PHASE',
  METADATA_ROLE = 'METADATA_ROLE',
  METADATA_STATUS = 'METADATA_STATUS',
  SUBSCRIBER = 'SUBSCRIBER',
  SUBSCRIPTION = 'SUBSCRIPTION',
  SUBSCRIBER_NOTIFICATION = 'SUBSCRIBER_NOTIFICATION',
}

/** Access level granted for the resource */
export enum ResourceAccessLevelEnum {
  LR = 'LR',
  R = 'R',
  RW = 'RW',
}

export enum JsonNodeNodeTypeEnum {
  ARRAY = 'ARRAY',
  BINARY = 'BINARY',
  BOOLEAN = 'BOOLEAN',
  MISSING = 'MISSING',
  NULL = 'NULL',
  NUMBER = 'NUMBER',
  OBJECT = 'OBJECT',
  POJO = 'POJO',
  STRING = 'STRING',
}

/**
 * Event type. Matches the eventlog EventType enum.
 * @minLength 1
 * @pattern ^(CREATE|READ|UPDATE|DELETE|ACCESS|EXECUTE|CANCEL|DROP)$
 */
export enum EventFilterTypeEnum {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ACCESS = 'ACCESS',
  EXECUTE = 'EXECUTE',
  CANCEL = 'CANCEL',
  DROP = 'DROP',
}

/**
 * Identifier type
 * @minLength 1
 * @pattern ^(adAccount|partyId)$
 */
export enum IdentifierTypeEnum {
  AdAccount = 'adAccount',
  PartyId = 'partyId',
}

/** Channel type */
export enum NotificationChannelTypeEnum {
  INTERNAL = 'INTERNAL',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

/** Target type */
export enum SubscriptionTargetTypeEnum {
  ERRAND = 'ERRAND',
  NAMESPACE = 'NAMESPACE',
}

/** Job type */
export enum JobResponseTypeEnum {
  MOVE_LABEL = 'MOVE_LABEL',
  ERRAND_PURGE = 'ERRAND_PURGE',
}

/** Job status */
export enum JobResponseStatusEnum {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED',
}

/** Type of metadata that the validation applies to */
export enum ValidationTypeEnum {
  CATEGORY = 'CATEGORY',
  EXTERNAL_ID_TYPE = 'EXTERNAL_ID_TYPE',
  STATUS = 'STATUS',
  TYPE = 'TYPE',
  ROLE = 'ROLE',
  CONTACT_REASON = 'CONTACT_REASON',
}

/** If the communication is inbound or outbound from the perspective of case-data/e-service. */
export enum CommunicationDirectionEnum {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

/** The communication was delivered by */
export enum CommunicationCommunicationTypeEnum {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WEB_MESSAGE = 'WEB_MESSAGE',
}

/** Type of message (user or system created) */
export enum MessageTypeEnum {
  USER_CREATED = 'USER_CREATED',
  SYSTEM_CREATED = 'SYSTEM_CREATED',
}

/** The channel the attachment was received via */
export enum ErrandAttachmentChannelEnum {
  EMAIL = 'EMAIL',
  ESERVICE = 'ESERVICE',
  WEB_UI = 'WEB_UI',
  MY_PAGES = 'MY_PAGES',
}

/**
 * Type of metadata to validate
 * @example "STATUS"
 */
export enum UpdateValidationParamsTypeEnum {
  CATEGORY = 'CATEGORY',
  EXTERNAL_ID_TYPE = 'EXTERNAL_ID_TYPE',
  STATUS = 'STATUS',
  TYPE = 'TYPE',
  ROLE = 'ROLE',
  CONTACT_REASON = 'CONTACT_REASON',
}

export enum UpdateValidationParamsEnum {
  CATEGORY = 'CATEGORY',
  EXTERNAL_ID_TYPE = 'EXTERNAL_ID_TYPE',
  STATUS = 'STATUS',
  TYPE = 'TYPE',
  ROLE = 'ROLE',
  CONTACT_REASON = 'CONTACT_REASON',
}
