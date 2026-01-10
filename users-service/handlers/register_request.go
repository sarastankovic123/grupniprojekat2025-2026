package handlers

type RegisterRequest struct {
	Username        string `json:"username" binding:"required,min=3,max=50,alphanumund"`
	Email           string `json:"email" binding:"required,email,min=5,max=255"`
	FirstName       string `json:"firstName" binding:"required,min=1,max=100"`
	LastName        string `json:"lastName" binding:"required,min=1,max=100"`
	Password        string `json:"password" binding:"required,min=8,max=128"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=Password"`
}
