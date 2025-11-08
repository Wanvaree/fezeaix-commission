// Models/User.cs
using System.ComponentModel.DataAnnotations;

namespace FezeaixCommission.Api.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string PasswordHash { get; set; } = string.Empty; // เก็บ password ที่ hash แล้ว

        [Required]
        [MaxLength(100)]
        public string DisplayName { get; set; } = string.Empty; // ชื่อที่แสดงผล

        // ในอนาคตอาจเพิ่ม Properties อื่นๆ เช่น Email, Role
    }
}