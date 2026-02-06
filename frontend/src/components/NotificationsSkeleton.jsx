import { Box, Skeleton } from '@mui/material';

export default function NotificationsSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {[1, 2, 3, 4, 5].map((item) => (
        <Box
          key={item}
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            p: 2,
            mb: 1,
            borderRadius: '8px',
            backgroundColor: 'background.paper',
          }}
        >
          {/* Icon Skeleton */}
          <Skeleton variant="circular" width={40} height={40} />

          {/* Text Content Skeleton */}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} />
          </Box>

          {/* Action Button Skeleton */}
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      ))}
    </Box>
  );
}
