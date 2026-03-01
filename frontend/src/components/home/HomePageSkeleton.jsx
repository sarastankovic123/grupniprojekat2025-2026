import {
  Box,
  Container,
  Skeleton,
  Grid,
  AppBar,
  Toolbar,
  Stack,
} from '@mui/material';

export default function HomePageSkeleton() {
  return (
    <Box>
      <AppBar position="sticky" color="default" elevation={1}>
        <Container maxWidth="xl">
          <Toolbar>
            <Skeleton variant="text" width={180} height={40} />
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={2}>
              <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Skeleton variant="text" width="60%" height={80} sx={{ mx: 'auto', mb: 2 }} />
            <Skeleton variant="text" width="50%" height={40} sx={{ mx: 'auto', mb: 4 }} />
            <Stack direction="row" spacing={2} justifyContent="center">
              <Skeleton variant="rectangular" width={160} height={48} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width={160} height={48} sx={{ borderRadius: 2 }} />
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Skeleton variant="text" width={250} height={48} sx={{ mx: 'auto', mb: 4 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Skeleton variant="text" width={250} height={48} sx={{ mx: 'auto', mb: 4 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
