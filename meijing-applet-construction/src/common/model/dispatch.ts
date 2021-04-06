
export interface Geometry {
  type: string,
  coordinates: number[][],
  properties: Properties
}

export interface Properties {
  value: number
}

export interface Feature {
  type: string,
  geometry: Geometry
}

export interface ControlAreaJson {
  type: string,
  features: Feature[]
}

//例行调度信息
export interface RoutineDispatch {
  id: number,
  divisionCode: string,
  emergencyDispatch: boolean,
  mainBodyUrl: string,
  controlProposalSummary: string,
  dispatchBeginTime: number,
  dispatchEndTime: number,
  controlAreaJson: ControlAreaJson,
  controlProposal: string
}

//响应式调度
export interface ReactiveDispatch {
  id: number,
  divisionCode: string,
  content: string,
  pictureLinks: string[],
  videoLink: string[],
  voiceLink: string,
  voiceDuration: number,
  dispatchUserId: number,
  dispatchUserName: string,
  dispatchUserAvatar: string,
  dispatchTime: number,
}

export interface ReactiveDispatchRequest {
  content: string,
  voiceOssKey?: string,
  videoOssKey?: string,
  pictureOssKeys?: string,
  attachmentOssKeys?: string,
  voiceDuration?: number
}