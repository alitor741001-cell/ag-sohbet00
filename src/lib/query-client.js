import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			// Veri elle değiştirilmediği sürece taze sayılır: sekmeler arasında gezinirken
			// sayfa anında açılır, ağ beklemesi olmaz. Değişiklikler realtime ile bildirilir.
			staleTime: 5 * 60 * 1000,
			gcTime: 30 * 60 * 1000,
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});