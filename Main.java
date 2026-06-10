import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());
        int[] arr = new int[N];
        StringTokenizer st = new StringTokenizer(br.readLine());
        
        for(int i = 0;i<N;i++) {
            arr[i] = Integer.parseInt(st.nextToken());
        }

        long answer = 0;

        for(int i = 0;i<N;i++) {
            int smallerCount = 0;

            // i 오른쪽에 있으면서 arr[i]보다 작은 수의 개수
            for(int k = i + 1;k<N;k++) {
                if(arr[k] < arr[i]) smallerCount++;
            }

            for(int j = i + 1;j<N;j++) {
                // j는 k보다 앞에 있어야 하므로, 현재 j는 이후 후보에서 제거
                if(arr[j] < arr[i]) smallerCount--;

                // arr[i] < arr[j] 이면, 남아있는 작은 수들이 k가 될 수 있음
                if(arr[i] < arr[j]) answer += smallerCount;
            }
        }

        System.out.println(answer);
    }
}