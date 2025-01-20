import {
    Sequelize,
    DataTypes,
    Model,
    Association,
    BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin, BelongsToManyGetAssociationsMixin
} from 'sequelize';

const sequelize = new Sequelize('twadb', 'twauser', 'twauser',  {
    host: 'localhost',
    dialect: 'postgres'
})

// Модель User
class User extends Model {
    declare id: number;
    declare telegramId: string;
    declare userName: string;
    declare isAdmin: boolean;

    // Ассоциированные методы
    public readonly events?: Event[]; // Связь с Event

    public static associations: {
        events: Association<User, Event>;
    };
    // Методы для работы с ассоциациями
    public getEvents!: BelongsToManyGetAssociationsMixin<Event>;
    public addEvent!: BelongsToManyAddAssociationMixin<Event, number>;
    public removeEvent!: BelongsToManyRemoveAssociationMixin<Event, number>;
}

// Модель Event
class Event extends Model {
    public id!: number;
    public title!: string;
    public description?: string;
    public date!: Date;

    // Ассоциированные методы
    public readonly users?: User[]; // Связь с User

    public static associations: {
        users: Association<Event, User>;
    };

    // Методы связи (добавим позже через belongsToMany)
    public addUser!: (user: User) => Promise<void>;
    public removeUser!: (user: User) => Promise<void>;
    public hasUser!: (user: User) => Promise<boolean>;
}

// Определение таблиц
User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
        },
        telegramId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        languageCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isBot: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    },
    {sequelize, modelName: 'User'}
);

Event.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: true,
        }
    },
    {sequelize, modelName: 'Event'}
);

// Ассоциация
User.belongsToMany(Event, {through: 'UserEvent'});
Event.belongsToMany(User, {through: 'UserEvent'});

// Синхронизация таблиц
sequelize.sync({alter: true});

export {User, Event};
