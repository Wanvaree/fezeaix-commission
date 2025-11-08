// Data/AppDbContext.cs
using FezeaixCommission.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FezeaixCommission.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!; // DbSet สำหรับตาราง Users

        // ในอนาคตเราจะเพิ่ม DbSet สำหรับ Gallery, Commission, Queue ที่นี่
    }
}