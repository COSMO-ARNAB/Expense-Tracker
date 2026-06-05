import React, { useEffect, useState } from 'react';
import { useUpdate } from '@/contexts/UpdateContext';
import UpdateAvailableModal from './UpdateAvailableModal';
import UpdateDownloadedModal from './UpdateDownloadedModal';
import UpdateDownloadProgress from './UpdateDownloadProgress';
import UpdateErrorToast from './UpdateErrorToast';

export default function UpdateHost() {
  const { state, actions } = useUpdate();
  const [toastError, setToastError] = useState(null);

  useEffect(() => {
    if (state.phase === 'error' && state.error) {
      setToastError(state.error);
    }
  }, [state.phase, state.error]);

  const dismissedFor =
    state.dismissedVersion &&
    state.availableUpdate &&
    state.dismissedVersion === state.availableUpdate.version;

  const showAvailable =
    state.phase === 'available' &&
    state.availableUpdate &&
    !dismissedFor;

  return (
    <>
      <UpdateAvailableModal
        open={!!showAvailable}
        currentVersion={state.info?.appVersion}
        availableUpdate={state.availableUpdate}
        downloading={state.phase === 'downloading'}
        onLater={() => actions.dismissModal(state.availableUpdate?.version)}
        onUpdate={actions.download}
      />
      <UpdateDownloadedModal
        open={state.phase === 'downloaded' && !!state.downloadedUpdate}
        currentVersion={state.info?.appVersion}
        downloadedUpdate={state.downloadedUpdate}
        onLater={() => {}}
        onInstall={actions.install}
      />
      <UpdateDownloadProgress
        phase={state.phase}
        progress={state.downloadProgress}
        onDismiss={() => {}}
      />
      <UpdateErrorToast
        error={toastError}
        onRetry={() => { setToastError(null); actions.check(); }}
        onDismiss={() => setToastError(null)}
      />
    </>
  );
}
