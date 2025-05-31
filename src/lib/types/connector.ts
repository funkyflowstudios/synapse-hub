// Cursor Connector Protocol types
// Defines communication protocol between Raspberry Pi and Connector service

import type { BaseEntity, ConnectorId, UserId } from './common';

// Cursor hardware specifications
export interface CursorHardwareSpecs {
  model: string;
  version: string;
  serialNumber: string;
  capabilities: CursorCapability[];
  sensors: CursorSensor[];
  actuators: CursorActuator[];
  connectivity: ConnectivityOptions;
  powerManagement: PowerManagement;
}

export interface CursorCapability {
  name: string;
  type: 'sensor' | 'actuator' | 'processing' | 'connectivity';
  description: string;
  specifications: Record<string, unknown>;
  isEnabled: boolean;
}

export interface CursorSensor {
  id: string;
  type: 'accelerometer' | 'gyroscope' | 'magnetometer' | 'proximity' | 'light' | 'temperature' | 'pressure' | 'custom';
  name: string;
  range: string;
  accuracy: string;
  sampleRate: number; // Hz
  powerConsumption: number; // mA
  calibration?: CalibrationData;
}

export interface CursorActuator {
  id: string;
  type: 'motor' | 'led' | 'speaker' | 'vibrator' | 'display' | 'custom';
  name: string;
  specifications: Record<string, unknown>;
  powerConsumption: number; // mA
  controlParameters: ActuatorControlParameters;
}

export interface ActuatorControlParameters {
  minValue: number;
  maxValue: number;
  stepSize: number;
  responseTime: number; // ms
  precision: number;
}

export interface ConnectivityOptions {
  wifi: WifiConfiguration;
  bluetooth: BluetoothConfiguration;
  usb: UsbConfiguration;
  ethernet?: EthernetConfiguration;
}

export interface WifiConfiguration {
  isSupported: boolean;
  standards: string[]; // e.g., ['802.11n', '802.11ac']
  frequencyBands: string[]; // e.g., ['2.4GHz', '5GHz']
  maxDataRate: string;
  range: string;
  powerConsumption: number; // mA
}

export interface BluetoothConfiguration {
  isSupported: boolean;
  version: string; // e.g., '5.0'
  protocols: string[]; // e.g., ['BLE', 'Classic']
  range: string;
  powerConsumption: number; // mA
}

export interface UsbConfiguration {
  isSupported: boolean;
  version: string; // e.g., '3.0'
  connectorType: string; // e.g., 'USB-C'
  maxDataRate: string;
  powerDelivery: boolean;
}

export interface EthernetConfiguration {
  isSupported: boolean;
  speed: string; // e.g., '1Gbps'
  connectorType: string; // e.g., 'RJ45'
}

export interface PowerManagement {
  batteryCapacity: number; // mAh
  chargingMethod: 'usb' | 'wireless' | 'dock' | 'replaceable';
  powerModes: PowerMode[];
  estimatedBatteryLife: Record<string, number>; // mode -> hours
}

export interface PowerMode {
  name: string;
  description: string;
  powerConsumption: number; // mA
  performanceLevel: number; // 0-100
  enabledFeatures: string[];
}

export interface CalibrationData {
  isCalibrated: boolean;
  calibratedAt?: Date;
  calibratedBy?: UserId;
  calibrationMatrix?: number[][];
  offsetValues?: number[];
  scalingFactors?: number[];
}

// Connector communication protocol
export interface ConnectorProtocol {
  version: string;
  messageFormat: 'json' | 'binary' | 'protobuf';
  compression: 'none' | 'gzip' | 'lz4';
  encryption: EncryptionConfiguration;
  authentication: AuthenticationConfiguration;
  heartbeat: HeartbeatConfiguration;
}

export interface EncryptionConfiguration {
  isEnabled: boolean;
  algorithm?: 'AES256' | 'ChaCha20' | 'RSA';
  keyExchange?: 'ECDH' | 'RSA' | 'DH';
  certificateValidation?: boolean;
}

export interface AuthenticationConfiguration {
  method: 'token' | 'certificate' | 'shared_key' | 'oauth';
  tokenExpiration?: number; // seconds
  refreshToken?: boolean;
  multiFactorAuth?: boolean;
}

export interface HeartbeatConfiguration {
  interval: number; // seconds
  timeout: number; // seconds
  maxMissedBeats: number;
  adaptiveInterval: boolean;
}

// Connector messages
export interface ConnectorMessage {
  id: string;
  timestamp: Date;
  type: ConnectorMessageType;
  sourceId: ConnectorId;
  targetId?: ConnectorId;
  data: unknown;
  priority: 'low' | 'normal' | 'high' | 'critical';
  requiresAck: boolean;
  correlationId?: string;
  ttl?: number; // seconds
}

export type ConnectorMessageType =
  // Connection management
  | 'connect'
  | 'disconnect'
  | 'heartbeat'
  | 'heartbeat_ack'
  | 'authentication'
  | 'auth_success'
  | 'auth_failure'
  
  // Device management
  | 'device_discovery'
  | 'device_info'
  | 'device_status'
  | 'device_config'
  | 'device_update'
  | 'device_reset'
  | 'device_calibrate'
  
  // Data transmission
  | 'sensor_data'
  | 'batch_sensor_data'
  | 'actuator_command'
  | 'actuator_response'
  | 'stream_start'
  | 'stream_data'
  | 'stream_stop'
  
  // System operations
  | 'system_info'
  | 'system_status'
  | 'log_entry'
  | 'error_report'
  | 'performance_metrics'
  | 'diagnostic_data'
  
  // Workflow integration
  | 'workflow_command'
  | 'workflow_response'
  | 'workflow_status'
  | 'workflow_result'
  
  // File operations
  | 'file_upload'
  | 'file_download'
  | 'file_delete'
  | 'file_list'
  
  // Configuration
  | 'config_get'
  | 'config_set'
  | 'config_update'
  | 'config_reset';

// Specific message data types
export interface ConnectMessage {
  deviceId: ConnectorId;
  deviceInfo: CursorHardwareSpecs;
  protocolVersion: string;
  capabilities: string[];
  credentials?: AuthenticationCredentials;
}

export interface AuthenticationCredentials {
  type: 'token' | 'certificate' | 'shared_key';
  value: string;
  metadata?: Record<string, unknown>;
}

export interface DeviceInfoMessage {
  deviceId: ConnectorId;
  hardwareSpecs: CursorHardwareSpecs;
  firmwareVersion: string;
  softwareVersion: string;
  lastBootTime: Date;
  uptime: number; // seconds
  systemHealth: DeviceHealth;
}

export interface DeviceHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'offline';
  temperature: number;
  batteryLevel: number;
  memoryUsage: number;
  cpuUsage: number;
  errors: DeviceError[];
  warnings: DeviceWarning[];
}

export interface DeviceError {
  code: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  context?: Record<string, unknown>;
}

export interface DeviceWarning {
  code: string;
  message: string;
  timestamp: Date;
  component: string;
  threshold?: number;
  currentValue?: number;
}

export interface SensorDataMessage {
  deviceId: ConnectorId;
  sensorId: string;
  timestamp: Date;
  data: SensorReading;
  sequence?: number;
  quality?: DataQuality;
}

export interface SensorReading {
  value: number | number[] | Record<string, number>;
  unit: string;
  accuracy?: number;
  precision?: number;
  calibrated: boolean;
}

export interface DataQuality {
  score: number; // 0-100
  issues: string[];
  reliability: 'high' | 'medium' | 'low';
}

export interface BatchSensorDataMessage {
  deviceId: ConnectorId;
  sensorId: string;
  startTimestamp: Date;
  endTimestamp: Date;
  readings: SensorReading[];
  compression?: 'none' | 'delta' | 'rle';
  checksum?: string;
}

export interface ActuatorCommandMessage {
  deviceId: ConnectorId;
  actuatorId: string;
  command: ActuatorCommand;
  parameters: Record<string, unknown>;
  timeout?: number; // seconds
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface ActuatorCommand {
  type: 'set_value' | 'increment' | 'decrement' | 'toggle' | 'sequence' | 'stop' | 'reset';
  value?: number | string | boolean;
  duration?: number; // seconds
  interpolation?: 'linear' | 'cubic' | 'step';
}

export interface ActuatorResponseMessage {
  deviceId: ConnectorId;
  actuatorId: string;
  commandId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number; // ms
  timestamp: Date;
}

export interface StreamMessage {
  deviceId: ConnectorId;
  streamId: string;
  action: 'start' | 'data' | 'stop';
  data?: unknown;
  metadata?: StreamMetadata;
}

export interface StreamMetadata {
  dataType: string;
  sampleRate: number;
  format: string;
  compression?: string;
  encryption?: string;
  quality?: string;
}

export interface WorkflowCommandMessage {
  deviceId: ConnectorId;
  workflowId: string;
  command: WorkflowCommand;
  parameters?: Record<string, unknown>;
  timeout?: number;
}

export interface WorkflowCommand {
  type: 'start' | 'stop' | 'pause' | 'resume' | 'abort' | 'status';
  stepId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface WorkflowResponseMessage {
  deviceId: ConnectorId;
  workflowId: string;
  commandId: string;
  status: 'accepted' | 'rejected' | 'executing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  progress?: number; // 0-100
  estimatedCompletion?: Date;
}

export interface SystemInfoMessage {
  deviceId: ConnectorId;
  systemInfo: {
    platform: string;
    architecture: string;
    kernel: string;
    totalMemory: number;
    availableMemory: number;
    cpuCores: number;
    cpuFrequency: number;
    storage: StorageInfo[];
    networkInterfaces: NetworkInterface[];
  };
}

export interface StorageInfo {
  device: string;
  type: 'ssd' | 'hdd' | 'emmc' | 'sd' | 'usb';
  totalSpace: number; // bytes
  availableSpace: number; // bytes
  mountPoint: string;
}

export interface NetworkInterface {
  name: string;
  type: 'wifi' | 'ethernet' | 'bluetooth' | 'cellular';
  status: 'up' | 'down' | 'connecting';
  ipAddress?: string;
  macAddress: string;
  signalStrength?: number; // dBm for wireless
  dataRate?: string;
}

export interface PerformanceMetricsMessage {
  deviceId: ConnectorId;
  timestamp: Date;
  metrics: PerformanceMetric[];
  interval: number; // seconds
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'sensor' | 'actuator' | 'system';
  threshold?: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface DiagnosticDataMessage {
  deviceId: ConnectorId;
  timestamp: Date;
  diagnostics: DiagnosticTest[];
  overallHealth: 'pass' | 'warning' | 'fail';
}

export interface DiagnosticTest {
  name: string;
  category: 'hardware' | 'software' | 'connectivity' | 'performance';
  result: 'pass' | 'warning' | 'fail' | 'skipped';
  message: string;
  details?: Record<string, unknown>;
  duration: number; // ms
}

export interface FileOperationMessage {
  deviceId: ConnectorId;
  operation: 'upload' | 'download' | 'delete' | 'list';
  path: string;
  metadata?: FileMetadata;
  data?: ArrayBuffer; // For upload/download
  options?: FileOperationOptions;
}

export interface FileMetadata {
  name: string;
  size: number;
  mimeType: string;
  permissions: string;
  owner: string;
  createdAt: Date;
  modifiedAt: Date;
  checksum: string;
}

export interface FileOperationOptions {
  overwrite?: boolean;
  backup?: boolean;
  compression?: boolean;
  encryption?: boolean;
  timeout?: number;
}

export interface ConfigurationMessage {
  deviceId: ConnectorId;
  operation: 'get' | 'set' | 'update' | 'reset';
  section?: string;
  key?: string;
  value?: unknown;
  configuration?: DeviceConfiguration;
}

export interface DeviceConfiguration {
  general: GeneralConfiguration;
  sensors: SensorConfiguration[];
  actuators: ActuatorConfiguration[];
  connectivity: ConnectivityConfiguration;
  power: PowerConfiguration;
  security: SecurityConfiguration;
  logging: LoggingConfiguration;
}

export interface GeneralConfiguration {
  deviceName: string;
  description?: string;
  location?: string;
  timezone: string;
  language: string;
  updateChannel: 'stable' | 'beta' | 'dev';
  autoUpdate: boolean;
}

export interface SensorConfiguration {
  sensorId: string;
  enabled: boolean;
  sampleRate: number;
  precision: number;
  threshold?: number;
  calibration?: CalibrationData;
  filtering?: FilterConfiguration;
}

export interface ActuatorConfiguration {
  actuatorId: string;
  enabled: boolean;
  defaultValue?: number;
  safeMode: boolean;
  limits: {
    min: number;
    max: number;
  };
  responseMode: 'immediate' | 'queued' | 'batch';
}

export interface ConnectivityConfiguration {
  preferredConnection: 'wifi' | 'ethernet' | 'cellular';
  wifi: WifiSettings;
  reconnectAttempts: number;
  reconnectInterval: number;
  keepAlive: boolean;
}

export interface WifiSettings {
  ssid: string;
  security: 'open' | 'wep' | 'wpa' | 'wpa2' | 'wpa3';
  autoConnect: boolean;
  hiddenNetwork: boolean;
  staticIp?: boolean;
  ipAddress?: string;
  gateway?: string;
  dnsServers?: string[];
}

export interface PowerConfiguration {
  powerMode: 'performance' | 'balanced' | 'power_saver' | 'custom';
  sleepTimeout: number; // seconds
  hibernateTimeout: number; // seconds
  lowBatteryThreshold: number; // percentage
  criticalBatteryThreshold: number; // percentage
  wakeupSources: string[];
}

export interface SecurityConfiguration {
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotation: number; // hours
  };
  authentication: {
    method: string;
    timeout: number; // seconds
    maxAttempts: number;
  };
  firewall: {
    enabled: boolean;
    allowedPorts: number[];
    blockedIps: string[];
  };
}

export interface LoggingConfiguration {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  maxFileSize: number; // bytes
  maxFiles: number;
  remoteLogging: boolean;
  logCategories: string[];
}

export interface FilterConfiguration {
  type: 'none' | 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'kalman';
  parameters: Record<string, number>;
  enabled: boolean;
}

// Connector state management
export interface ConnectorState {
  deviceId: ConnectorId;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastSeen: Date;
  protocolVersion: string;
  capabilities: string[];
  configuration: DeviceConfiguration;
  health: DeviceHealth;
  metrics: PerformanceMetric[];
  activeStreams: string[];
  pendingCommands: string[];
  errors: DeviceError[];
  warnings: DeviceWarning[];
}

// Error handling and status codes
export enum ConnectorErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'CONN_001',
  CONNECTION_TIMEOUT = 'CONN_002',
  CONNECTION_LOST = 'CONN_003',
  AUTHENTICATION_FAILED = 'CONN_004',
  PROTOCOL_MISMATCH = 'CONN_005',
  
  // Hardware errors
  SENSOR_FAILURE = 'HW_001',
  ACTUATOR_FAILURE = 'HW_002',
  POWER_FAILURE = 'HW_003',
  OVERHEATING = 'HW_004',
  LOW_BATTERY = 'HW_005',
  
  // Software errors
  FIRMWARE_ERROR = 'SW_001',
  CONFIG_ERROR = 'SW_002',
  CALIBRATION_ERROR = 'SW_003',
  UPDATE_FAILED = 'SW_004',
  
  // Data errors
  DATA_CORRUPTION = 'DATA_001',
  DATA_OVERFLOW = 'DATA_002',
  INVALID_COMMAND = 'DATA_003',
  UNSUPPORTED_OPERATION = 'DATA_004',
  
  // System errors
  MEMORY_ERROR = 'SYS_001',
  STORAGE_ERROR = 'SYS_002',
  NETWORK_ERROR = 'SYS_003',
  TIMEOUT_ERROR = 'SYS_004'
}

export interface ConnectorError {
  code: ConnectorErrorCode;
  message: string;
  timestamp: Date;
  deviceId: ConnectorId;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
  recovery?: RecoveryAction[];
}

export interface RecoveryAction {
  type: 'retry' | 'reset' | 'recalibrate' | 'update' | 'replace' | 'manual';
  description: string;
  automated: boolean;
  priority: number;
  estimatedTime?: number; // seconds
}

// Service interfaces
export interface ConnectorService {
  connect(deviceId: ConnectorId, credentials?: AuthenticationCredentials): Promise<ConnectorState>;
  disconnect(deviceId: ConnectorId): Promise<void>;
  sendCommand(deviceId: ConnectorId, message: ConnectorMessage): Promise<ConnectorMessage>;
  subscribeToEvents(deviceId: ConnectorId, eventTypes: ConnectorMessageType[]): Promise<void>;
  unsubscribeFromEvents(deviceId: ConnectorId, eventTypes: ConnectorMessageType[]): Promise<void>;
  getDeviceInfo(deviceId: ConnectorId): Promise<DeviceInfoMessage>;
  updateConfiguration(deviceId: ConnectorId, config: Partial<DeviceConfiguration>): Promise<void>;
  runDiagnostics(deviceId: ConnectorId): Promise<DiagnosticDataMessage>;
  getPerformanceMetrics(deviceId: ConnectorId): Promise<PerformanceMetricsMessage>;
  uploadFile(deviceId: ConnectorId, path: string, data: ArrayBuffer): Promise<void>;
  downloadFile(deviceId: ConnectorId, path: string): Promise<ArrayBuffer>;
} 