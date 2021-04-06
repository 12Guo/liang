
export interface Inspect {
  id: number,
  content: string,
  latitude: number,
  longitude: number,
  pictureLinks: string[],
  createTime: number,
  pollutionTypeName: string,
  pollutionTypeId: number,
  type: string,
  status: boolean
}
