package com.example.gmail_android.utils;

// generic wrapper class to represent the state of a data resource.
public class Result<T> {
    // representing the current state of the resource.
    public enum Status { SUCCESS, ERROR, LOADING }
    // current status of the resource.
    public final Status status;
    // the actual data.
    public final T data;
    // optional message for errors.
    public final String message;

    // private constructor.
    private Result(Status s, T d, String m) { status = s; data = d; message = m; }
    // creates a success result with the given data.
    public static <T> Result<T> success(T data) { return new Result<>(Status.SUCCESS, data, null); }
    // the error message.
    public static <T> Result<T> error(String msg) { return new Result<>(Status.ERROR, null, msg); }
    // creates a loading result with no data or message.
    public static <T> Result<T> loading() { return new Result<>(Status.LOADING, null, null); }
}
