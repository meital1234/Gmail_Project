package com.example.gmail_android.utils;

public class Result<T> {
    public enum Status { SUCCESS, ERROR, LOADING }
    public final Status status;
    public final T data;
    public final String message;

    private Result(Status s, T d, String m) { status = s; data = d; message = m; }
    public static <T> Result<T> success(T data) { return new Result<>(Status.SUCCESS, data, null); }
    public static <T> Result<T> error(String msg) { return new Result<>(Status.ERROR, null, msg); }
    public static <T> Result<T> loading() { return new Result<>(Status.LOADING, null, null); }
}
