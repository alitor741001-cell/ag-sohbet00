import { base44 } from '@/api/base44Client';

export default async function checkFaceStep(step, file) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  const { data } = await base44.functions.invoke('face-verify', {
    action: 'check_step', step, face_uri: file_uri,
  });
  return data;
}