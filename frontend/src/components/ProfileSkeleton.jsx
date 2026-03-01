import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

export default function ProfileSkeleton() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card elevation={3}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Skeleton variant="circular" width={120} height={120} />
              <Skeleton variant="text" width={150} height={40} sx={{ mt: 2 }} />
              <Skeleton variant="rounded" width={80} height={24} sx={{ mt: 1, borderRadius: '6px' }} />
            </Box>

            <Skeleton variant="rectangular" height={1} sx={{ my: 2 }} />

            <Box sx={{ mt: 2 }}>
              {[1, 2, 3, 4].map((item) => (
                <Box key={item} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={16} />
                    <Skeleton variant="text" width="80%" height={20} />
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 3 }}>
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: '10px' }} />
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: '10px' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card elevation={3}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
              <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: '6px' }} />
              <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: '6px' }} />
              <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: '6px' }} />
            </Box>
          </Box>

          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              <Skeleton variant="rounded" height={56} sx={{ borderRadius: '10px' }} />
              <Skeleton variant="rounded" height={56} sx={{ borderRadius: '10px' }} />
              <Skeleton variant="rounded" height={56} sx={{ borderRadius: '10px' }} />
            </Box>
            <Skeleton
              variant="rounded"
              width={150}
              height={42}
              sx={{ mt: 3, borderRadius: '10px' }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
