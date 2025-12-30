import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent'),
            allowNull: false,
            defaultValue: 'student'
        },
        avatar: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {
                public_id: null,
                secure_url: "https://cdn.pixabay.com/photo/2014/04/03/10/41/person-311134_1280.png"
            }
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active'
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['email'] },
            { fields: ['role'] },
            { fields: ['status'] }
        ]
    });

    User.associate = (models) => {
        // One-to-One with Student (for student users)
        User.hasOne(models.Student, {
            foreignKey: 'userId',
            as: 'studentProfile'
        });

        // One-to-One with Teacher (for teacher users)
        User.hasOne(models.Teacher, {
            foreignKey: 'userId',
            as: 'teacherProfile'
        });

        // One-to-One with Parent (for parent users)
        User.hasOne(models.Parent, {
            foreignKey: 'userId',
            as: 'parentProfile'
        });

        // User can create notifications
        User.hasMany(models.Notification, {
            foreignKey: 'userId',
            as: 'notifications'
        });
    };

    return User;
};