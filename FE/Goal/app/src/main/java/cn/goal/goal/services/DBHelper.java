package cn.goal.goal.services;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

/**
 * Created by chenlin on 19/02/2017.
 */
public class DBHelper extends SQLiteOpenHelper {
    public DBHelper(Context context, String name, SQLiteDatabase.CursorFactory factory, int version) {
        super(context, name, factory, version);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        String goalTable = "create table goal(id INTEGER PRIMARY KEY AUTOINCREMENT, _id varchar(100), title varchar(200), content varchar(2000), begin varchar(20), plan varchar(20), end varchar(20), createAt varchar(20), updateAt varchar(20), finished int)";
        db.execSQL(goalTable);
        String noteTable = "create table note(id INTEGER PRIMARY KEY AUTOINCREMENT, _id varchar(100), content varchar(2000), createAt varchar(20), updateAt varchar(20))";
        db.execSQL(noteTable);
        String dailySentenceTable = "create table dailySentence(_id varchar(100), date varchar(20), sentence varchar(200), backImg varchar(500))";
        db.execSQL(dailySentenceTable);
        String goalsFinishedTable = "create table goalsFinished(id INTEGER PRIMARY KEY AUTOINCREMENT, _id varchar(100), date varchar(20), goalId int)";
        db.execSQL(goalsFinishedTable);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {

    }


}