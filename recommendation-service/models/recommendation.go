package models

type RecommendedSong struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Duration string `json:"duration"`
	TrackNo  int    `json:"trackNo"`
	AlbumID  string `json:"albumId"`
	Genre    string `json:"genre"`
}

type RecommendationResponse struct {
	SubscribedGenreSongs []RecommendedSong `json:"subscribedGenreSongs"`
	DiscoverNewSongs     []RecommendedSong `json:"discoverNewSongs"`
}
