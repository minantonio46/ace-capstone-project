import api from './axiosInstance';

export async function getSkeletonFrames(dataId) {
  const { data } = await api.get(`/api/skeleton/${encodeURIComponent(dataId)}`);
  return data.data;
}
